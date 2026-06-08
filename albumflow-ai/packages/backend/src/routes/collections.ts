import { Router, Response } from 'express';
import { z } from 'zod';
import prisma from '../lib/prisma';
import { authenticate, AuthRequest } from '../middleware/auth';

const router = Router();

// All collection routes require authentication
router.use(authenticate);

// ─── Slug generator ────────────────────────────────────────────────────
function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '') + '-' + Math.random().toString(36).substring(2, 8);
}

// ─── Validation ────────────────────────────────────────────────────────
const createCollectionSchema = z.object({
  collection_name: z.string().min(2),
  client_name: z.string().min(2),
  event_type: z.string().min(2),
  event_date: z.string(),
});

// ─── GET /api/collections ──────────────────────────────────────────────
router.get('/', async (req: AuthRequest, res: Response) => {
  const { status, search, page = '1', limit = '20' } = req.query;
  const skip = (parseInt(page as string) - 1) * parseInt(limit as string);

  const where: any = { user_id: req.user!.id };
  if (status) where.status = status;
  if (search) {
    where.OR = [
      { collection_name: { contains: search as string, mode: 'insensitive' } },
      { client_name: { contains: search as string, mode: 'insensitive' } },
    ];
  }

  const [collections, total] = await Promise.all([
    prisma.collection.findMany({
      where,
      orderBy: { created_at: 'desc' },
      skip,
      take: parseInt(limit as string),
      select: {
        id: true,
        collection_name: true,
        client_name: true,
        event_type: true,
        event_date: true,
        status: true,
        total_photos: true,
        selected_photos: true,
        client_access_token: true,
        created_at: true,
        confirmed_at: true,
      },
    }),
    prisma.collection.count({ where }),
  ]);

  return res.json({ collections, total, page: parseInt(page as string), limit: parseInt(limit as string) });
});

// ─── POST /api/collections ─────────────────────────────────────────────
router.post('/', async (req: AuthRequest, res: Response) => {
  try {
    const body = createCollectionSchema.parse(req.body);

    const collection = await prisma.collection.create({
      data: {
        user_id: req.user!.id,
        collection_name: body.collection_name,
        client_name: body.client_name,
        event_type: body.event_type,
        event_date: new Date(body.event_date),
        collection_slug: generateSlug(body.collection_name),
        status: 'UPLOADING',
        expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
      },
    });

    // Log activity
    await prisma.activityLog.create({
      data: {
        user_id: req.user!.id,
        collection_id: collection.id,
        action: 'COLLECTION_CREATED',
        description: `Collection "${body.collection_name}" created for ${body.client_name}`,
      },
    });

    return res.status(201).json({ collection });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return res.status(400).json({ error: 'Validation failed', details: err.errors });
    }
    throw err;
  }
});

// ─── GET /api/collections/:id ──────────────────────────────────────────
router.get('/:id', async (req: AuthRequest, res: Response) => {
  const collection = await prisma.collection.findFirst({
    where: { id: req.params.id, user_id: req.user!.id },
    include: {
      photos: {
        select: {
          id: true,
          original_filename: true,
          file_size: true,
          s3_preview_key: true,
          upload_status: true,
          width: true,
          height: true,
          created_at: true,
        },
        orderBy: { created_at: 'asc' },
      },
      photo_selections: {
        where: { selected: true },
        select: { photo_id: true },
      },
      export_jobs: {
        orderBy: { created_at: 'desc' },
        take: 1,
      },
    },
  });

  if (!collection) return res.status(404).json({ error: 'Collection not found' });

  const selectedIds = new Set(collection.photo_selections.map((s) => s.photo_id));
  const photosWithSelection = collection.photos.map((p) => ({
    ...p,
    is_selected: selectedIds.has(p.id),
  }));

  return res.json({ collection: { ...collection, photos: photosWithSelection } });
});

// ─── PATCH /api/collections/:id ───────────────────────────────────────
router.patch('/:id', async (req: AuthRequest, res: Response) => {
  const allowed = ['collection_name', 'client_name', 'event_type', 'event_date', 'status'];
  const updates: any = {};
  for (const key of allowed) {
    if (req.body[key] !== undefined) {
      updates[key] = key === 'event_date' ? new Date(req.body[key]) : req.body[key];
    }
  }

  const collection = await prisma.collection.updateMany({
    where: { id: req.params.id, user_id: req.user!.id },
    data: updates,
  });

  if (!collection.count) return res.status(404).json({ error: 'Collection not found' });
  return res.json({ success: true });
});

// ─── DELETE /api/collections/:id ──────────────────────────────────────
router.delete('/:id', async (req: AuthRequest, res: Response) => {
  const collection = await prisma.collection.findFirst({
    where: { id: req.params.id, user_id: req.user!.id },
  });

  if (!collection) return res.status(404).json({ error: 'Collection not found' });

  await prisma.collection.update({
    where: { id: req.params.id },
    data: { status: 'DELETED' },
  });

  await prisma.activityLog.create({
    data: {
      user_id: req.user!.id,
      collection_id: req.params.id,
      action: 'COLLECTION_DELETED',
      description: `Collection "${collection.collection_name}" deleted`,
    },
  });

  return res.json({ success: true });
});

// ─── GET /api/collections/:id/link ────────────────────────────────────
router.get('/:id/link', async (req: AuthRequest, res: Response) => {
  const collection = await prisma.collection.findFirst({
    where: { id: req.params.id, user_id: req.user!.id },
    select: { id: true, client_access_token: true, collection_name: true },
  });

  if (!collection) return res.status(404).json({ error: 'Collection not found' });

  const link = `${process.env.FRONTEND_URL}/gallery/${collection.client_access_token}`;
  return res.json({ link, token: collection.client_access_token });
});

export default router;
