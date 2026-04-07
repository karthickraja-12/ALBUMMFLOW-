import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";

export async function POST(request, { params }) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { id } = await params;
    const { url, storage_path, google_file_id } = await request.json();

    if (!url || !storage_path) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const photo = await prisma.photo.create({
      data: {
        event_id: id,
        url,
        storage_path,
        // We include thumbnails as the same URL for now, or cloudfront can handle it
        selections: {
          // Initialize empty if needed
        }
      }
    });

    // If Google Drive ID exists, we could store it in a metadata field if added to schema,
    // but the current schema uses explicit fields.
    
    return NextResponse.json(photo);
  } catch (error) {
    console.error("Photo DB Sync Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
