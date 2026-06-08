import { Router, Response } from 'express';
import { z } from 'zod';
import prisma from '../lib/prisma';
import { authenticate, AuthRequest } from '../middleware/auth';

const router = Router();
router.use(authenticate);

const brandingSchema = z.object({
  logo_url: z.string().url().optional().nullable(),
  watermark_type: z.enum(['TEXT', 'LOGO', 'COMBINED']).optional(),
  watermark_text: z.string().optional(),
  watermark_position: z.enum(['TOP_LEFT', 'TOP_RIGHT', 'CENTER', 'BOTTOM_LEFT', 'BOTTOM_RIGHT']).optional(),
  watermark_opacity: z.number().min(10).max(50).optional(),
  show_phone: z.boolean().optional(),
  show_website: z.boolean().optional(),
});

// ─── GET /api/branding ─────────────────────────────────────────────────
router.get('/', async (req: AuthRequest, res: Response) => {
  let branding = await prisma.brandingSetting.findUnique({
    where: { user_id: req.user!.id },
  });

  if (!branding) {
    branding = await prisma.brandingSetting.create({
      data: {
        user_id: req.user!.id,
        watermark_type: 'TEXT',
        watermark_position: 'BOTTOM_RIGHT',
        watermark_opacity: 30,
      },
    });
  }

  return res.json({ branding });
});

// ─── PUT /api/branding ─────────────────────────────────────────────────
router.put('/', async (req: AuthRequest, res: Response) => {
  try {
    const body = brandingSchema.parse(req.body);

    const branding = await prisma.brandingSetting.upsert({
      where: { user_id: req.user!.id },
      create: { user_id: req.user!.id, ...body },
      update: body,
    });

    return res.json({ branding });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return res.status(400).json({ error: 'Validation failed', details: err.errors });
    }
    throw err;
  }
});

export default router;
