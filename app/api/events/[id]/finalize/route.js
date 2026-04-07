import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";

export async function POST(request, { params }) {
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

    // 2. Finalize
    await prisma.event.update({
      where: { id },
      data: { is_finalized: true }
    });

    return NextResponse.json({ success: true, message: "Event finalized and locked" });
  } catch (error) {
    console.error("Finalize Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
