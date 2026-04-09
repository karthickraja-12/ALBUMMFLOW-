import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { s3Client } from "@/lib/s3";
import { ListObjectsV2Command, DeleteObjectsCommand } from "@aws-sdk/client-s3";

export async function GET(request, { params }) {
  try {
    const { id } = await params;

    const event = await prisma.event.findUnique({
      where: { id },
      include: {
        photographer: {
          select: {
            company_name: true,
            brand_color: true,
            image: true
          }
        },
        photos: true,
        selections: true
      }
    });

    if (!event) {
      return NextResponse.json({ error: "Event not found" }, { status: 404 });
    }

    return NextResponse.json({
      event,
      photos: event.photos || [],
      selections: event.selections || [],
      photographer: event.photographer
    });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(request, { params }) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const { id } = await params;

    // 1. Verify Ownership
    const event = await prisma.event.findUnique({
      where: { id },
      select: { photographer_id: true }
    });

    if (!event) return NextResponse.json({ error: "Event not found" }, { status: 404 });
    if (event.photographer_id !== session.user.id && session.user.role !== "super_admin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // 2. Delete S3 Objects with Isolated Path
    // Paths are now: users/{userId}/events/{id}/
    const userId = event.photographer_id;
    const prefix = `users/${userId}/events/${id}/`;
    
    // We also delete the legacy path for broad compatibility during transition
    const legacyPrefix = `events/${id}/`;
    
    const deleteFolder = async (folderPrefix) => {
      const listCommand = new ListObjectsV2Command({
        Bucket: process.env.AWS_S3_BUCKET_NAME,
        Prefix: folderPrefix
      });

      const listedObjects = await s3Client.send(listCommand);

      if (listedObjects.Contents && listedObjects.Contents.length > 0) {
        const deleteParams = {
          Bucket: process.env.AWS_S3_BUCKET_NAME,
          Delete: { Objects: listedObjects.Contents.map(({ Key }) => ({ Key })) }
        };
        await s3Client.send(new DeleteObjectsCommand(deleteParams));
        console.log(`Purged ${listedObjects.Contents.length} files from S3 path ${folderPrefix}`);
      }
    };

    await deleteFolder(prefix);
    await deleteFolder(legacyPrefix);

    // 3. Delete Database Record (Cascades to photos/selections in schema)
    await prisma.event.delete({
      where: { id }
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Delete Event Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
