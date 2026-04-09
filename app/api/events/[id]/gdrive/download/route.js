import { NextResponse } from "next/server";
import { google } from "googleapis";
import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { deleteObjects } from "@/lib/s3";
import { Readable } from "stream";

export async function POST(request, { params }) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id: eventId } = await params;
  const { eventName } = await request.json();

  try {
    // 1. Fetch photographer's Google Drive credentials
    const userProfile = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { google_refresh_token: true }
    });

    if (!userProfile?.google_refresh_token) {
      return NextResponse.json(
        { error: 'Google Drive is not connected. Please go to Settings and click "Connect Archive".' },
        { status: 400 }
      );
    }

    // 2. Fetch ALL photos for this event (to delete originals of non-selected ones too)
    const allPhotos = await prisma.photo.findMany({
      where: { event_id: eventId }
    });

    // 3. Fetch selected photo IDs
    const selections = await prisma.selection.findMany({
      where: { event_id: eventId },
      select: { photo_id: true }
    });
    const selectedPhotoIds = new Set(selections.map(s => s.photo_id));
    const finalistPhotos = allPhotos.filter(p => selectedPhotoIds.has(p.id));

    if (finalistPhotos.length === 0) {
      return NextResponse.json({ error: "No selected photos found for this event." }, { status: 404 });
    }

    // 4. Set up Google Drive client
    const oauth2Client = new google.auth.OAuth2(
      (process.env.GOOGLE_CLIENT_ID || "").trim(),
      (process.env.GOOGLE_CLIENT_SECRET || "").trim(),
      (process.env.GOOGLE_REDIRECT_URI || "").trim()
    );
    oauth2Client.setCredentials({ refresh_token: userProfile.google_refresh_token });
    const drive = google.drive({ version: "v3", auth: oauth2Client });

    // 5. Find or create root "AlbumFlow" folder in Drive
    let rootFolderId = null;
    const rootRes = await drive.files.list({
      q: "mimeType='application/vnd.google-apps.folder' and name='AlbumFlow' and trashed=false",
      fields: "files(id)"
    });
    if (rootRes.data.files && rootRes.data.files.length > 0) {
      rootFolderId = rootRes.data.files[0].id;
    } else {
      const newRoot = await drive.files.create({
        requestBody: { name: "AlbumFlow", mimeType: "application/vnd.google-apps.folder" },
        fields: "id"
      });
      rootFolderId = newRoot.data.id;
    }

    // 6. Find or create event Winners folder: AlbumFlow/{eventName}_Winners
    const winnersFolderName = `${eventName}_Winners`;
    let winnersFolderId = null;
    const winnersRes = await drive.files.list({
      q: `mimeType='application/vnd.google-apps.folder' and name='${winnersFolderName}' and '${rootFolderId}' in parents and trashed=false`,
      fields: "files(id)"
    });
    if (winnersRes.data.files && winnersRes.data.files.length > 0) {
      winnersFolderId = winnersRes.data.files[0].id;
    } else {
      const newWinners = await drive.files.create({
        requestBody: {
          name: winnersFolderName,
          mimeType: "application/vnd.google-apps.folder",
          parents: [rootFolderId]
        },
        fields: "id"
      });
      winnersFolderId = newWinners.data.id;
    }

    // 7. Upload each selected photo to Drive (original if available, else compressed)
    let uploadedCount = 0;
    for (const photo of finalistPhotos) {
      try {
        // Prefer original full-size, fall back to compressed
        const sourceUrl = photo.original_storage_path
          ? `https://${process.env.AWS_S3_BUCKET_NAME}.s3.${process.env.AWS_REGION}.amazonaws.com/${photo.original_storage_path}`
          : photo.url;

        const filename = decodeURIComponent(sourceUrl).split('/').pop().split('-').slice(5).join('-');
        const mimeType = filename.toLowerCase().endsWith('.png') ? 'image/png' :
                         filename.toLowerCase().endsWith('.gif') ? 'image/gif' : 'image/jpeg';

        const s3Response = await fetch(sourceUrl);
        if (!s3Response.ok) {
          console.warn(`[Sync] Failed to fetch photo from S3: ${sourceUrl}`);
          continue;
        }

        const nodeStream = Readable.fromWeb(s3Response.body);
        await drive.files.create({
          requestBody: { name: filename, parents: [winnersFolderId] },
          media: { mimeType, body: nodeStream },
          fields: "id"
        });

        uploadedCount++;
      } catch (photoErr) {
        console.error(`[Sync] Error uploading photo ${photo.id}:`, photoErr.message);
      }
    }

    if (uploadedCount === 0) {
      return NextResponse.json({ error: "Failed to upload any photos to Google Drive." }, { status: 500 });
    }

    // 8. Delete ALL originals for this event from S3 (selected and non-selected)
    const originalKeysToDelete = allPhotos
      .filter(p => p.original_storage_path)
      .map(p => p.original_storage_path);

    if (originalKeysToDelete.length > 0) {
      try {
        await deleteObjects(originalKeysToDelete);
        console.log(`[Sync] Deleted ${originalKeysToDelete.length} original(s) from S3`);

        // Clear original_storage_path in DB
        await prisma.photo.updateMany({
          where: { event_id: eventId },
          data: { original_storage_path: null }
        });
      } catch (deleteErr) {
        console.warn("[Sync] Could not delete originals from S3:", deleteErr.message);
      }
    }

    // 9. Mark event as finalized
    await prisma.event.update({
      where: { id: eventId },
      data: { is_finalized: true }
    });

    return NextResponse.json({
      success: true,
      message: `Successfully archived ${uploadedCount} of ${finalistPhotos.length} selection(s) to the Winners folder. Originals cleaned up from S3.`
    });

  } catch (error) {
    console.error("GDrive Sync Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
