const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function testQuery(eventId) {
  try {
    const photosWithOriginals = await prisma.photo.findMany({
      where: { 
        event_id: eventId,
        original_storage_path: { not: null }
      },
      include: {
        selections: {
          take: 1
        }
      }
    });

    console.log(`Total photos found with originals: ${photosWithOriginals.length}`);

    const toDelete = photosWithOriginals.filter(photo => {
      const isSelected = photo.selections.length > 0;
      const isSyncedToGDrive = !!photo.google_file_id;
      return !isSelected || (isSelected && isSyncedToGDrive);
    });

    console.log(`Photos to clear from S3: ${toDelete.length}`);
    toDelete.forEach(p => {
      console.log(` - ID: ${p.id}, Selected: ${p.selections.length > 0}, Synced: !!${p.google_file_id}, Path: ${p.original_storage_path}`);
    });

  } catch (err) {
    console.error(err);
  } finally {
    await prisma.$disconnect();
  }
}

// Replace with a real event ID from your DB to test
const eventId = process.argv[2] || 'test-event-id';
testQuery(eventId);
