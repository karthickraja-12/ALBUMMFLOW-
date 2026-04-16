import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";

const STORAGE_LIMITS = {
  pro: 20 * 1024 * 1024 * 1024, // 20GB
  elite: 100 * 1024 * 1024 * 1024, // 100GB
};

export async function POST(request, { params }) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { id } = await params;
    const body = await request.json();
    const { url, storage_path, original_storage_path, size } = body;

    const photoSize = parseInt(size) || 0;

    if (!url || !storage_path) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    // 1. Quota Guard: Check if user has enough space
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { storage_used: true, subscription_plan: true }
    });

    const currentUsed = Number(user.storage_used || 0);
    const plan = user.subscription_plan || "pro";
    const limit = STORAGE_LIMITS[plan] || STORAGE_LIMITS.pro;

    if (currentUsed + photoSize > limit) {
      return NextResponse.json({ 
        error: "Storage limit reached", 
        details: { used: currentUsed, limit, incoming: photoSize } 
      }, { status: 402 });
    }

    // 2. Atomic Update: Create photo and update user storage usage
    const result = await prisma.$transaction(async (tx) => {
      const newPhoto = await tx.photo.create({
        data: {
          event_id: id,
          url,
          storage_path,
          original_storage_path: original_storage_path || null,
          size: photoSize
        }
      });

      await tx.user.update({
        where: { id: session.user.id },
        data: {
          storage_used: { increment: photoSize }
        }
      });

      return newPhoto;
    });

    return NextResponse.json(result);
  } catch (error) {
    console.error("Photo DB Sync Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
