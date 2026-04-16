import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { deleteObjects } from "@/lib/s3";

export async function POST(request, { params }) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const { id } = await params;

    // 1. Verify Ownership
    const event = await prisma.event.findUnique({
      where: { id },
      select: { photographer_id: true, name: true }
    });

    if (!event) return NextResponse.json({ error: "Event not found" }, { status: 404 });
    const isOwner = event.photographer_id === session.user.id;
    const isAdmin = session.user.role === "super_admin";

    if (!isOwner && !isAdmin) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // 2. Identify Photos to Cleanup (Originals that are unselected or already synced)
    const photosWithOriginals = await prisma.photo.findMany({
      where: { 
        event_id: id,
        original_storage_path: { not: null }
      },
      select: {
        id: true,
        original_storage_path: true,
        size: true,
        google_file_id: true,
        selections: {
          take: 1
        }
      }
    });

    const toDelete = photosWithOriginals.filter(photo => {
      const isSelected = photo.selections.length > 0;
      const isSyncedToGDrive = !!photo.google_file_id;
      
      // Delete from S3 if:
      // a) The photo was NOT selected by the client
      // b) The photo WAS selected but is ALREADY synced to Google Drive (safe to remove from S3)
      return !isSelected || (isSelected && isSyncedToGDrive);
    });

    const keysToDelete = toDelete.map(p => p.original_storage_path);
    const totalSizeToFree = toDelete.reduce((acc, p) => acc + (p.size || 0), 0);
    let deletedCount = 0;

    // 3. Perform Batch Cleanup in S3 & Database (Chunked in 1000s)
    if (keysToDelete.length > 0) {
      try {
        // AWS S3 DeleteObjects supports max 1000 keys per request
        const chunkSize = 1000;
        for (let i = 0; i < keysToDelete.length; i += chunkSize) {
          const chunk = keysToDelete.slice(i, i + chunkSize);
          await deleteObjects(chunk);
        }
        
        // Transaction: Clear original paths and decrement total user storage usage
        await prisma.$transaction([
          prisma.photo.updateMany({
            where: { id: { in: toDelete.map(p => p.id) } },
            data: { original_storage_path: null }
          }),
          prisma.user.update({
            where: { id: session.user.id },
            data: {
              storage_used: { decrement: totalSizeToFree }
            }
          })
        ]);
        
        deletedCount = keysToDelete.length;
      } catch (s3Error) {
        console.error("S3 Cleanup Partial Failure:", s3Error);
        // We continue anyway so the event can still be finalized
      }
    }

    // 4. Finalize the Event
    await prisma.event.update({
      where: { id },
      data: { is_finalized: true }
    });

    return NextResponse.json({ 
      success: true, 
      message: "Event finalized and S3 storage optimized",
      details: {
        totalPhotosParsed: photosWithOriginals.length,
        originalsDeleted: deletedCount
      }
    });
  } catch (error) {
    console.error("Finalize Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
