import { Router, Request, Response } from 'express';
import prisma from '../lib/prisma';

const router = Router();

// ─── GET /api/gallery/:token ───────────────────────────────────────────
// Public route — no auth required
router.get('/:token', async (req: Request, res: Response) => {
  const { token } = req.params;

  const collection = await prisma.collection.findUnique({
    where: { client_access_token: token },
    include: {
      user: {
        select: {
          full_name: true,
          studio_name: true,
          phone: true,
          website: true,
          branding: true,
        },
      },
      photos: {
        where: { upload_status: 'READY' },
        select: {
          id: true,
          original_filename: true,
          s3_preview_key: true,
          width: true,
          height: true,
        },
        orderBy: { created_at: 'asc' },
      },
      photo_selections: {
        where: { selected: true },
        select: { photo_id: true },
      },
    },
  });

  if (!collection) return res.status(404).json({ error: 'Gallery not found' });
  if (collection.status === 'DELETED') return res.status(410).json({ error: 'Gallery no longer available' });

  // Build photo list with selection state
  const selectedIds = new Set(collection.photo_selections.map((s) => s.photo_id));

  // Create or find client session
  const userAgent = req.headers['user-agent'] || '';
  const ip = req.ip;
  const isMobile = /mobile|android|iphone/i.test(userAgent);
  const isTablet = /tablet|ipad/i.test(userAgent);
  const deviceType = isMobile ? 'mobile' : isTablet ? 'tablet' : 'desktop';

  let sessionToken = req.headers['x-session-token'] as string;
  let session;

  if (sessionToken) {
    session = await prisma.clientSession.findUnique({ where: { session_token: sessionToken } });
    if (session) {
      await prisma.clientSession.update({
        where: { id: session.id },
        data: { last_activity: new Date() },
      });
    }
  }

  if (!session) {
    session = await prisma.clientSession.create({
      data: {
        collection_id: collection.id,
        device_type: deviceType,
        browser: userAgent.substring(0, 100),
        ip_address: ip,
      },
    });
    sessionToken = session.session_token;
  }

  // Update collection status to CLIENT_VIEWING if AWAITING_CLIENT
  if (collection.status === 'AWAITING_CLIENT' || collection.status === 'READY') {
    await prisma.collection.update({
      where: { id: collection.id },
      data: { status: 'CLIENT_VIEWING' },
    });
  }

  // Check locking state based on Google Sheets status logic
  let isPending = collection.status === 'AWAITING_CLIENT' || collection.status === 'CLIENT_VIEWING';
  let unlockedIndices: number[] = [3]; // Default/Fallback: 3rd photo is unlocked

  if (process.env.LICENSE_VALIDATION_URL && process.env.LICENSE_VALIDATION_URL !== 'mock') {
    try {
      const response = await fetch(process.env.LICENSE_VALIDATION_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'check_gallery_access',
          client_access_token: token,
        }),
      });
      if (response.ok) {
        const data = (await response.json()) as any;
        if (data.status === 'Active') {
          isPending = false;
        } else if (data.status === 'Pending') {
          isPending = true;
        }
        if (data.unlocked_photos) {
          if (Array.isArray(data.unlocked_photos)) {
            unlockedIndices = data.unlocked_photos.map(Number);
          } else if (typeof data.unlocked_photos === 'string') {
            unlockedIndices = data.unlocked_photos
              .split(',')
              .map((s: string) => parseInt(s.trim(), 10))
              .filter((n: number) => !isNaN(n));
          }
        }
      }
    } catch (err) {
      console.error('Failed to validate gallery via Google Sheets:', err);
    }
  }

  const photos = collection.photos.map((p, idx) => {
    const photoIndex = idx + 1;
    const isLocked = isPending && !unlockedIndices.includes(photoIndex);
    return {
      id: p.id,
      preview_url: p.s3_preview_key
        ? `https://${process.env.AWS_S3_BUCKET}.s3.${process.env.AWS_REGION}.amazonaws.com/${p.s3_preview_key}`
        : null,
      is_selected: selectedIds.has(p.id),
      width: p.width,
      height: p.height,
      is_locked: isLocked,
      photo_index: photoIndex,
    };
  });

  return res.json({
    collection: {
      id: collection.id,
      collection_name: collection.collection_name,
      client_name: collection.client_name,
      event_type: collection.event_type,
      event_date: collection.event_date,
      status: collection.status,
      total_photos: collection.total_photos,
      selected_count: collection.selected_photos,
      is_confirmed: collection.status === 'CONFIRMED' || collection.status === 'EXPORTED',
    },
    studio: {
      name: collection.user.studio_name || collection.user.full_name,
      phone: collection.user.phone,
      website: collection.user.website,
      branding: collection.user.branding,
    },
    photos,
    session_token: sessionToken,
  });
});

// ─── POST /api/gallery/:token/select ──────────────────────────────────
router.post('/:token/select', async (req: Request, res: Response) => {
  const { token } = req.params;
  const { photo_id, selected, session_token } = req.body;

  const collection = await prisma.collection.findUnique({
    where: { client_access_token: token },
  });
  if (!collection) return res.status(404).json({ error: 'Gallery not found' });
  if (collection.status === 'CONFIRMED' || collection.status === 'EXPORTED') {
    return res.status(403).json({ error: 'Selection is locked after confirmation' });
  }

  // Verify photo belongs to collection
  const photo = await prisma.photo.findFirst({
    where: { id: photo_id, collection_id: collection.id },
  });
  if (!photo) return res.status(404).json({ error: 'Photo not found' });

  // Verify session
  const session = await prisma.clientSession.findUnique({
    where: { session_token, collection_id: collection.id },
  });

  // Upsert selection
  if (selected) {
    await prisma.photoSelection.upsert({
      where: { collection_id_photo_id: { collection_id: collection.id, photo_id } },
      create: {
        collection_id: collection.id,
        photo_id,
        selected: true,
        client_session_id: session?.id,
      },
      update: { selected: true, selected_at: new Date() },
    });
  } else {
    await prisma.photoSelection.deleteMany({
      where: { collection_id: collection.id, photo_id },
    });
  }

  // Update selected count
  const count = await prisma.photoSelection.count({
    where: { collection_id: collection.id, selected: true },
  });
  await prisma.collection.update({
    where: { id: collection.id },
    data: { selected_photos: count },
  });

  return res.json({ success: true, selected_count: count });
});

// ─── POST /api/gallery/:token/confirm ─────────────────────────────────
router.post('/:token/confirm', async (req: Request, res: Response) => {
  const { token } = req.params;

  const collection = await prisma.collection.findUnique({
    where: { client_access_token: token },
    include: {
      user: { select: { id: true, email: true } },
      photo_selections: { where: { selected: true } },
    },
  });

  if (!collection) return res.status(404).json({ error: 'Gallery not found' });
  if (collection.status === 'CONFIRMED' || collection.status === 'EXPORTED') {
    return res.status(409).json({ error: 'Already confirmed' });
  }
  if (collection.photo_selections.length === 0) {
    return res.status(400).json({ error: 'Please select at least one photo before confirming' });
  }

  // Lock collection
  await prisma.collection.update({
    where: { id: collection.id },
    data: {
      status: 'CONFIRMED',
      confirmed_at: new Date(),
      selected_photos: collection.photo_selections.length,
    },
  });

  // Create export job
  await prisma.exportJob.create({
    data: {
      collection_id: collection.id,
      user_id: collection.user.id,
      status: 'PENDING',
      total_files: collection.photo_selections.length,
    },
  });

  await prisma.activityLog.create({
    data: {
      user_id: collection.user.id,
      collection_id: collection.id,
      action: 'CLIENT_CONFIRMED',
      description: `Client confirmed ${collection.photo_selections.length} photos`,
    },
  });

  return res.json({ success: true, selected_count: collection.photo_selections.length });
});

export default router;
