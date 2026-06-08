import { Router, Response } from 'express';
import { z } from 'zod';
import prisma from '../lib/prisma';
import { authenticate, AuthRequest } from '../middleware/auth';

const router = Router();
router.use(authenticate);

// Mock S3 helper (replace with real AWS SDK in production)
async function getPresignedUrl(key: string, contentType: string): Promise<string> {
  if (process.env.AWS_ACCESS_KEY_ID === 'mock') {
    return `http://localhost:3001/mock-upload/${encodeURIComponent(key)}?contentType=${contentType}`;
  }
  // Real AWS S3 implementation — install @aws-sdk/client-s3 and @aws-sdk/s3-request-presigner
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const { S3Client, PutObjectCommand } = require('@aws-sdk/client-s3');
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const { getSignedUrl } = require('@aws-sdk/s3-request-presigner');
  const s3 = new S3Client({
    region: process.env.AWS_REGION,
    credentials: {
      accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
      secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
    },
  });
  const command = new PutObjectCommand({
    Bucket: process.env.AWS_S3_BUCKET,
    Key: key,
    ContentType: contentType,
  });
  return getSignedUrl(s3, command, { expiresIn: 3600 });
}

const presignSchema = z.object({
  collection_id: z.string().uuid(),
  filename: z.string(),
  file_size: z.number(),
  file_type: z.string(),
  checksum: z.string().optional(),
});

// ─── POST /api/upload/presign ──────────────────────────────────────────
router.post('/presign', async (req: AuthRequest, res: Response) => {
  try {
    const body = presignSchema.parse(req.body);

    // Verify collection belongs to user
    const collection = await prisma.collection.findFirst({
      where: { id: body.collection_id, user_id: req.user!.id },
    });
    if (!collection) return res.status(404).json({ error: 'Collection not found' });

    const ext = body.filename.split('.').pop()?.toLowerCase();
    const safeFilename = `${Date.now()}-${Math.random().toString(36).substring(2, 8)}.${ext}`;
    const s3Key = `${body.collection_id}/originals/${safeFilename}`;

    // Create photo record
    const photo = await prisma.photo.create({
      data: {
        collection_id: body.collection_id,
        original_filename: body.filename,
        file_size: BigInt(body.file_size),
        file_type: body.file_type,
        s3_original_key: s3Key,
        checksum: body.checksum,
        upload_status: 'UPLOADING',
      },
    });

    const presignedUrl = await getPresignedUrl(s3Key, body.file_type);

    return res.json({ photo_id: photo.id, presigned_url: presignedUrl, s3_key: s3Key });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return res.status(400).json({ error: 'Validation failed', details: err.errors });
    }
    throw err;
  }
});

// ─── POST /api/upload/complete ─────────────────────────────────────────
router.post('/complete', async (req: AuthRequest, res: Response) => {
  const { photo_id, width, height } = req.body;
  if (!photo_id) return res.status(400).json({ error: 'photo_id required' });

  const photo = await prisma.photo.findUnique({
    where: { id: photo_id },
    include: { collection: true },
  });
  if (!photo || photo.collection.user_id !== req.user!.id) {
    return res.status(404).json({ error: 'Photo not found' });
  }

  await prisma.photo.update({
    where: { id: photo_id },
    data: {
      upload_status: 'PROCESSING',
      width,
      height,
    },
  });

  // Update collection photo count
  await prisma.collection.update({
    where: { id: photo.collection_id },
    data: { total_photos: { increment: 1 } },
  });

  return res.json({ success: true, photo_id });
});

// ─── POST /api/upload/finalize/:collectionId ───────────────────────────
router.post('/finalize/:collectionId', async (req: AuthRequest, res: Response) => {
  const collection = await prisma.collection.findFirst({
    where: { id: req.params.collectionId, user_id: req.user!.id },
  });
  if (!collection) return res.status(404).json({ error: 'Collection not found' });

  await prisma.collection.update({
    where: { id: req.params.collectionId },
    data: {
      upload_completed: true,
      status: 'READY',
    },
  });

  // Mark all PROCESSING photos as READY
  await prisma.photo.updateMany({
    where: { collection_id: req.params.collectionId, upload_status: 'PROCESSING' },
    data: { upload_status: 'READY', s3_preview_key: `${req.params.collectionId}/previews/` },
  });

  await prisma.activityLog.create({
    data: {
      user_id: req.user!.id,
      collection_id: req.params.collectionId,
      action: 'PHOTOS_UPLOADED',
      description: `Upload finalized for collection`,
    },
  });

  return res.json({ success: true });
});

export default router;
