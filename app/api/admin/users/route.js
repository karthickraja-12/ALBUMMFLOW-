import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";
export const dynamic = 'force-dynamic';


// Helper to check if user is super_admin
async function checkAdmin() {
  const session = await auth();
  if (session?.user?.role !== "super_admin") {
    throw new Error("Unauthorized");
  }
  return session;
}

export async function GET() {
  try {
    await checkAdmin();
    const users = await prisma.user.findMany({
      orderBy: { created_at: "desc" }
    });
    return NextResponse.json(users);
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: error.message === "Unauthorized" ? 403 : 500 });
  }
}

export async function PATCH(request) {
  try {
    await checkAdmin();
    const { userId, ...updateData } = await request.json();

    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: updateData
    });

    return NextResponse.json(updatedUser);
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: error.message === "Unauthorized" ? 403 : 500 });
  }
}
