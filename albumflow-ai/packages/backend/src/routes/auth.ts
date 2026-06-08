import { Router, Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { z } from 'zod';
import prisma from '../lib/prisma';
import { authenticate, AuthRequest } from '../middleware/auth';

const router = Router();

// ─── Validation Schemas ────────────────────────────────────────────────
const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  full_name: z.string().min(2),
  studio_name: z.string().optional(),
  phone: z.string().optional(),
});

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

// ─── POST /api/auth/register ───────────────────────────────────────────
router.post('/register', async (req: Request, res: Response) => {
  try {
    const body = registerSchema.parse(req.body);

    const existing = await prisma.user.findUnique({ where: { email: body.email } });
    if (existing) {
      return res.status(409).json({ error: 'Email already registered' });
    }

    const password_hash = await bcrypt.hash(body.password, 12);

    const user = await prisma.user.create({
      data: {
        email: body.email,
        password_hash,
        full_name: body.full_name,
        studio_name: body.studio_name,
        phone: body.phone,
        // Create branding defaults
        branding: {
          create: {
            watermark_type: 'TEXT',
            watermark_position: 'BOTTOM_RIGHT',
            watermark_opacity: 30,
            show_phone: true,
            show_website: true,
          },
        },
        // Create analytics record
        analytics: {
          create: {},
        },
        // Create google drive connection record
        google_drive: {
          create: {
            is_connected: false,
          },
        },
      },
      select: {
        id: true,
        email: true,
        full_name: true,
        studio_name: true,
        license_status: true,
        plan: true,
        created_at: true,
      },
    });

    const token = jwt.sign(
      { id: user.id, email: user.email },
      process.env.JWT_SECRET!,
      { expiresIn: (process.env.JWT_EXPIRES_IN || '7d') as any }
    );

    return res.status(201).json({ user, token });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return res.status(400).json({ error: 'Validation failed', details: err.errors });
    }
    throw err;
  }
});

// ─── POST /api/auth/login ──────────────────────────────────────────────
router.post('/login', async (req: Request, res: Response) => {
  try {
    const body = loginSchema.parse(req.body);

    const user = await prisma.user.findUnique({ where: { email: body.email } });
    if (!user || !user.is_active) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    const valid = await bcrypt.compare(body.password, user.password_hash);
    if (!valid) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    // Update last login
    await prisma.user.update({
      where: { id: user.id },
      data: { last_login: new Date() },
    });

    const token = jwt.sign(
      { id: user.id, email: user.email },
      process.env.JWT_SECRET!,
      { expiresIn: (process.env.JWT_EXPIRES_IN || '7d') as any }
    );

    return res.json({
      user: {
        id: user.id,
        email: user.email,
        full_name: user.full_name,
        studio_name: user.studio_name,
        phone: user.phone,
        license_status: user.license_status,
        plan: user.plan,
        last_login: user.last_login,
      },
      token,
    });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return res.status(400).json({ error: 'Validation failed', details: err.errors });
    }
    throw err;
  }
});

// ─── GET /api/auth/me ──────────────────────────────────────────────────
router.get('/me', authenticate, async (req: AuthRequest, res: Response) => {
  const user = await prisma.user.findUnique({
    where: { id: req.user!.id },
    select: {
      id: true,
      email: true,
      full_name: true,
      studio_name: true,
      phone: true,
      website: true,
      license_status: true,
      plan: true,
      last_login: true,
      created_at: true,
      branding: true,
      google_drive: {
        select: {
          is_connected: true,
          google_email: true,
          last_sync: true,
        },
      },
    },
  });

  if (!user) return res.status(404).json({ error: 'User not found' });
  return res.json({ user });
});

export default router;
