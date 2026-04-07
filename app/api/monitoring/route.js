import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";

export async function POST(request) {
  try {
    const session = await auth();
    const userId = session?.user?.id || null;

    const body = await request.json();
    const { level, message, details, source } = body;

    await prisma.monitoringLog.create({
      data: {
        user_id: userId,
        level: level || "error",
        message: message || "No message provided",
        details: details || {},
        source: source || "client"
      }
    });

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("Failed to save log:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
