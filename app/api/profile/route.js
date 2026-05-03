import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";

export async function GET() {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const user = await prisma.user.findUnique({
      where: { id: session.user.id }
    });

    const serializedUser = user ? {
      ...user,
      storage_used: user.storage_used?.toString()
    } : null;

    return NextResponse.json(serializedUser);
  } catch (error) {
    console.error("[GET /api/profile] Error:", error);
    return NextResponse.json({ error: "An unexpected error occurred while fetching the profile." }, { status: 500 });
  }
}

export async function PATCH(request) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { company_name, logo_url, brand_color } = body;

    const updatedUser = await prisma.user.update({
      where: { id: session.user.id },
      data: {
        company_name,
        image: logo_url, // Using standard 'image' field for logo in NextAuth schema
        brand_color
      }
    });

    const serializedUpdatedUser = updatedUser ? {
      ...updatedUser,
      storage_used: updatedUser.storage_used?.toString()
    } : null;

    return NextResponse.json(serializedUpdatedUser);
  } catch (error) {
    console.error("[PATCH /api/profile] Error:", error);
    return NextResponse.json({ error: "An unexpected error occurred while updating the profile." }, { status: 500 });
  }
}
