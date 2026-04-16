const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function calibrate() {
  console.log("🚀 Starting Storage Calibration...");

  try {
    const photographers = await prisma.user.findMany({
      where: { role: 'photographer' },
      select: { id: true, name: true }
    });

    for (const p of photographers) {
      const photos = await prisma.photo.findMany({
        where: { 
          event: { photographer_id: p.id },
          original_storage_path: { not: null } 
        },
        select: { size: true }
      });

      const totalUsed = photos.reduce((acc, photo) => acc + (photo.size || 0), 0);

      await prisma.user.update({
        where: { id: p.id },
        data: { storage_used: totalUsed }
      });

      console.log(`✅ Updated ${p.name || p.id}: ${totalUsed} bytes used.`);
    }

    console.log("✨ Calibration Complete!");
  } catch (err) {
    console.error("❌ Calibration Failed:", err);
  } finally {
    await prisma.$disconnect();
  }
}

calibrate();
