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
    const { url, storage_path, original_storage_path } = await request.json();

    if (!url || !storage_path) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    let photo;
    try {
      photo = await prisma.photo.create({
        data: {
          event_id: id,
          url,
          storage_path,
          original_storage_path: original_storage_path || null,
        }
      });
    } catch (e) {
      // Fallback if new columns don't exist yet (before prisma db push)
      photo = await prisma.photo.create({
        data: { event_id: id, url, storage_path }
      });
    }

    return NextResponse.json(photo);
  } catch (error) {
    console.error("Photo DB Sync Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
