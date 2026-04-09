import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { getPresignedUploadUrl } from "@/lib/s3";
import { v4 as uuidv4 } from "uuid";
import prisma from "@/lib/prisma";

export async function POST(request) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { filename, contentType, eventId } = await request.json();

    if (!filename || !contentType || !eventId) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    // 1. Verify that the event belongs to this photographer (User Isolation Check)
    // EXCEPTION: 'branding' eventId is used for studio logos which don't have a specific event
    if (eventId !== 'branding') {
      const event = await prisma.event.findUnique({
        where: { 
          id: eventId,
          photographer_id: session.user.id
        }
      });

      if (!event) {
        return NextResponse.json({ error: "Event not found or access denied" }, { status: 404 });
      }
    }

    const sanitizedName = filename.replace(/[^a-zA-Z0-9.-]/g, "_");
    const fileId = uuidv4();
    const userId = session.user.id;

    // 2. Updated isolated paths: 
    // - Events: users/{userId}/events/{eventId}/...
    // - Branding: users/{userId}/branding/...
    const isBranding = eventId === 'branding';
    const folderPath = isBranding 
      ? `users/${userId}/branding` 
      : `users/${userId}/events/${eventId}/compressed`;
    
    const compressedKey = `${folderPath}/${fileId}-${sanitizedName}`;
    const compressedUploadUrl = await getPresignedUploadUrl(compressedKey, contentType);
    const publicUrl = `https://${process.env.AWS_S3_BUCKET_NAME}.s3.${process.env.AWS_REGION}.amazonaws.com/${compressedKey}`;

    const originalKey = `users/${userId}/events/${eventId}/originals/${fileId}-${sanitizedName}`;
    const originalUploadUrl = await getPresignedUploadUrl(originalKey, contentType);

    return NextResponse.json({
      uploadUrl: compressedUploadUrl,
      key: compressedKey,
      publicUrl,
      originalUploadUrl,
      originalKey,
    });
  } catch (error) {
    console.error("Presigned URL Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
