import { Router, Request, Response } from 'express';
import prisma from '../lib/prisma';
import { authenticate, AuthRequest } from '../middleware/auth';

const router = Router();

// ─── POST /api/license/validate ───────────────────────────────────────
router.post('/validate', authenticate, async (req: AuthRequest, res: Response) => {
  const { license_key } = req.body;
  if (!license_key) return res.status(400).json({ error: 'license_key required' });

  // Mock validation for dev environment
  if (process.env.LICENSE_VALIDATION_URL === 'mock') {
    const mockValid = license_key.startsWith('AF-');
    if (!mockValid) return res.status(400).json({ error: 'Invalid license key format' });

    await prisma.user.update({
      where: { id: req.user!.id },
      data: {
        license_key,
        license_status: 'ACTIVE',
        plan: 'PRO',
      },
    });

    await prisma.license.upsert({
      where: { license_key },
      create: {
        user_id: req.user!.id,
        license_key,
        plan: 'PRO',
        start_date: new Date(),
        expiry_date: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
        status: 'ACTIVE',
      },
      update: {
        user_id: req.user!.id,
        status: 'ACTIVE',
      },
    });

    return res.json({
      valid: true,
      plan: 'PRO',
      status: 'ACTIVE',
      expires_at: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
    });
  }

  // Real Google Apps Script validation
  try {
    const response = await fetch(process.env.LICENSE_VALIDATION_URL!, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ license_key, email: req.user!.email }),
    });
    const data = (await response.json()) as any;

    if (data.valid) {
      await prisma.user.update({
        where: { id: req.user!.id },
        data: {
          license_key,
          license_status: data.status,
          plan: data.plan,
        },
      });
      return res.json(data);
    } else {
      return res.status(400).json({ error: 'Invalid or expired license key' });
    }
  } catch (e) {
    return res.status(503).json({ error: 'License server unavailable' });
  }
});

// ─── GET /api/license/info ────────────────────────────────────────────
router.get('/info', authenticate, async (req: AuthRequest, res: Response) => {
  const user = await prisma.user.findUnique({
    where: { id: req.user!.id },
    include: {
      licenses: { orderBy: { created_at: 'desc' }, take: 1 },
    },
  });

  return res.json({
    license_key: user?.license_key,
    license_status: user?.license_status,
    plan: user?.plan,
    license: user?.licenses[0] || null,
  });
});

export default router;
