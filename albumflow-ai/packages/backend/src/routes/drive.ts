import { Router, Response } from 'express';
import prisma from '../lib/prisma';
import { authenticate, AuthRequest } from '../middleware/auth';

const router = Router();
router.use(authenticate);

// ─── GET /api/drive/status ─────────────────────────────────────────────
router.get('/status', async (req: AuthRequest, res: Response) => {
  const drive = await prisma.googleDriveConnection.findUnique({
    where: { user_id: req.user!.id },
    select: {
      is_connected: true,
      google_email: true,
      last_sync: true,
      folder_root_id: true,
    },
  });

  return res.json({ drive: drive || { is_connected: false } });
});

// ─── GET /api/drive/connect — Generate OAuth URL ───────────────────────
router.get('/connect', async (req: AuthRequest, res: Response) => {
  if (process.env.GOOGLE_CLIENT_ID === 'mock') {
    return res.json({
      auth_url: `http://localhost:3001/api/drive/mock-callback?user_id=${req.user!.id}`,
      mock: true,
    });
  }

  const { google } = await import('googleapis');
  const oauth2Client = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    process.env.GOOGLE_REDIRECT_URI
  );

  const authUrl = oauth2Client.generateAuthUrl({
    access_type: 'offline',
    scope: ['https://www.googleapis.com/auth/drive.file'],
    state: req.user!.id,
    prompt: 'consent',
  });

  return res.json({ auth_url: authUrl });
});

// ─── GET /api/drive/callback — OAuth callback ──────────────────────────
router.get('/callback', async (req: AuthRequest, res: Response) => {
  const { code, state: userId } = req.query;
  if (!code || !userId) return res.status(400).json({ error: 'Missing code or state' });

  if (process.env.GOOGLE_CLIENT_ID === 'mock') {
    await prisma.googleDriveConnection.upsert({
      where: { user_id: userId as string },
      create: {
        user_id: userId as string,
        google_email: 'mock@gmail.com',
        google_account_id: 'mock-id',
        access_token: 'mock-token',
        refresh_token: 'mock-refresh',
        is_connected: true,
        last_sync: new Date(),
      },
      update: {
        google_email: 'mock@gmail.com',
        is_connected: true,
        last_sync: new Date(),
      },
    });
    return res.redirect(`${process.env.FRONTEND_URL}/settings/drive?connected=true`);
  }

  const { google } = await import('googleapis');
  const oauth2Client = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    process.env.GOOGLE_REDIRECT_URI
  );
  const { tokens } = await oauth2Client.getToken(code as string);
  oauth2Client.setCredentials(tokens);

  const oauth2 = google.oauth2({ version: 'v2', auth: oauth2Client });
  const userInfo = await oauth2.userinfo.get();

  await prisma.googleDriveConnection.upsert({
    where: { user_id: userId as string },
    create: {
      user_id: userId as string,
      google_email: userInfo.data.email || '',
      google_account_id: userInfo.data.id || '',
      access_token: tokens.access_token || '',
      refresh_token: tokens.refresh_token || '',
      is_connected: true,
      last_sync: new Date(),
    },
    update: {
      access_token: tokens.access_token || '',
      refresh_token: tokens.refresh_token || tokens.refresh_token,
      google_email: userInfo.data.email || '',
      is_connected: true,
      last_sync: new Date(),
    },
  });

  return res.redirect(`${process.env.FRONTEND_URL}/settings/drive?connected=true`);
});

// ─── POST /api/drive/disconnect ───────────────────────────────────────
router.post('/disconnect', async (req: AuthRequest, res: Response) => {
  await prisma.googleDriveConnection.update({
    where: { user_id: req.user!.id },
    data: {
      is_connected: false,
      access_token: null,
      refresh_token: null,
      google_email: null,
    },
  });
  return res.json({ success: true });
});

// ─── POST /api/export/:collectionId ──────────────────────────────────
router.post('/export/:collectionId', async (req: AuthRequest, res: Response) => {
  const collection = await prisma.collection.findFirst({
    where: { id: req.params.collectionId, user_id: req.user!.id, status: 'CONFIRMED' },
    include: {
      photo_selections: {
        where: { selected: true },
        include: { photo: true },
      },
    },
  });

  if (!collection) return res.status(404).json({ error: 'Collection not found or not confirmed' });

  const drive = await prisma.googleDriveConnection.findUnique({
    where: { user_id: req.user!.id, is_connected: true },
  });

  if (!drive && process.env.GOOGLE_CLIENT_ID !== 'mock') {
    return res.status(400).json({ error: 'Google Drive not connected' });
  }

  // Create or update export job
  let exportJob = await prisma.exportJob.findFirst({
    where: { collection_id: collection.id, status: { in: ['PENDING', 'PROCESSING'] } },
  });

  if (!exportJob) {
    exportJob = await prisma.exportJob.create({
      data: {
        collection_id: collection.id,
        user_id: req.user!.id,
        status: 'PENDING',
        total_files: collection.photo_selections.length,
      },
    });
  }

  // In production: trigger a background job/queue here
  // For MVP: simulate success
  await prisma.exportJob.update({
    where: { id: exportJob.id },
    data: {
      status: 'SUCCESS',
      completed_files: collection.photo_selections.length,
      started_at: new Date(),
      completed_at: new Date(),
      google_folder_id: 'mock-folder-id',
    },
  });

  await prisma.collection.update({
    where: { id: collection.id },
    data: { status: 'EXPORTED' },
  });

  await prisma.activityLog.create({
    data: {
      user_id: req.user!.id,
      collection_id: collection.id,
      action: 'EXPORT_COMPLETED',
      description: `${collection.photo_selections.length} photos exported to Google Drive`,
    },
  });

  return res.json({ success: true, exported_count: collection.photo_selections.length });
});

export default router;
