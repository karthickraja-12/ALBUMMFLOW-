import { Router, Response } from 'express';
import prisma from '../lib/prisma';
import { authenticate, AuthRequest } from '../middleware/auth';

const router = Router();
router.use(authenticate);

// ─── GET /api/analytics ───────────────────────────────────────────────
router.get('/', async (req: AuthRequest, res: Response) => {
  const userId = req.user!.id;

  const [
    totalCollections,
    pendingCollections,
    completedCollections,
    totalPhotos,
    totalSelected,
    recentActivity,
    monthlyData,
  ] = await Promise.all([
    prisma.collection.count({ where: { user_id: userId } }),
    prisma.collection.count({
      where: { user_id: userId, status: { in: ['UPLOADING', 'PROCESSING', 'READY', 'AWAITING_CLIENT', 'CLIENT_VIEWING'] } },
    }),
    prisma.collection.count({ where: { user_id: userId, status: { in: ['CONFIRMED', 'EXPORTED'] } } }),
    prisma.photo.aggregate({
      where: { collection: { user_id: userId } },
      _sum: { file_size: true },
      _count: { id: true },
    }),
    prisma.photoSelection.count({
      where: { collection: { user_id: userId }, selected: true },
    }),
    prisma.activityLog.findMany({
      where: { user_id: userId },
      orderBy: { created_at: 'desc' },
      take: 10,
      select: { action: true, description: true, created_at: true },
    }),
    // Monthly collections for last 6 months
    prisma.$queryRaw<Array<{ month: string; count: bigint }>>`
      SELECT 
        TO_CHAR(created_at, 'Mon YYYY') as month,
        COUNT(*) as count
      FROM collections
      WHERE user_id = ${userId}
        AND created_at >= NOW() - INTERVAL '6 months'
      GROUP BY TO_CHAR(created_at, 'Mon YYYY'), DATE_TRUNC('month', created_at)
      ORDER BY DATE_TRUNC('month', created_at) ASC
    `,
  ]);

  // Update analytics record
  await prisma.analytics.upsert({
    where: { user_id: userId },
    create: {
      user_id: userId,
      total_collections: totalCollections,
      total_uploads: BigInt(totalPhotos._count.id),
      total_selected: BigInt(totalSelected),
      total_storage_used: totalPhotos._sum.file_size || BigInt(0),
    },
    update: {
      total_collections: totalCollections,
      total_uploads: BigInt(totalPhotos._count.id),
      total_selected: BigInt(totalSelected),
      total_storage_used: totalPhotos._sum.file_size || BigInt(0),
      last_calculated: new Date(),
    },
  });

  const selectionRate =
    totalPhotos._count.id > 0
      ? Math.round((totalSelected / totalPhotos._count.id) * 100)
      : 0;

  return res.json({
    stats: {
      total_collections: totalCollections,
      pending_collections: pendingCollections,
      completed_collections: completedCollections,
      total_photos: totalPhotos._count.id,
      total_selected: totalSelected,
      selection_rate: selectionRate,
      storage_used_bytes: Number(totalPhotos._sum.file_size || 0),
    },
    monthly_data: monthlyData.map((m) => ({ month: m.month, count: Number(m.count) })),
    recent_activity: recentActivity,
  });
});

export default router;
