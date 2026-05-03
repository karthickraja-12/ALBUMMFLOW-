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
    
    // Serialize BigInt fields for JSON response
    const serializedUsers = users.map(user => ({
      ...user,
      storage_used: user.storage_used.toString()
    }));
    
    return NextResponse.json(serializedUsers);
  } catch (error) {
    console.error("[GET /api/admin/users] Error:", error.message, error.code ?? "");
    return NextResponse.json({ error: error.message === "Unauthorized" ? "Unauthorized" : "An unexpected error occurred while fetching users." }, { status: error.message === "Unauthorized" ? 403 : 500 });
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
    console.error("[PATCH /api/admin/users] Error:", error.message, error.code ?? "");
    return NextResponse.json({ error: error.message === "Unauthorized" ? "Unauthorized" : "An unexpected error occurred while updating the user." }, { status: error.message === "Unauthorized" ? 403 : 500 });
  }
}
