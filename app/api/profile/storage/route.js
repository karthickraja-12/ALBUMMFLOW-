import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";

const STORAGE_LIMITS = {
  pro: 20 * 1024 * 1024 * 1024, // 20GB
  elite: 100 * 1024 * 1024 * 1024, // 100GB
};

export async function GET() {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { storage_used: true, subscription_plan: true }
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Convert BigInt to Number for JSON serialization
    const usedBytes = Number(user.storage_used || 0);
    const plan = user.subscription_plan || "pro";
    const limitBytes = STORAGE_LIMITS[plan] || STORAGE_LIMITS.pro;
    const percentage = Math.min(100, Math.round((usedBytes / limitBytes) * 100));

    return NextResponse.json({
      usedBytes,
      limitBytes,
      percentage,
      plan,
      readableUsed: formatBytes(usedBytes),
      readableLimit: formatBytes(limitBytes),
    });
  } catch (error) {
    console.error("Storage API Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

function formatBytes(bytes, decimals = 2) {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
}
