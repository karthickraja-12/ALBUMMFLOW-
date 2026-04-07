import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import bcrypt from "bcryptjs"; // Needs installation

export async function POST(request) {
  try {
    const { email, password, company_name } = await request.json();

    if (!email || !password) {
      return NextResponse.json({ error: "Email and password required" }, { status: 400 });
    }

    // 1. Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email }
    });

    if (existingUser) {
      return NextResponse.json({ error: "User already exists" }, { status: 400 });
    }

    // 2. Hash password
    // NOTE: NextAuth Auth.js requires hashing passwords for the credentials provider
    const hashedPassword = await bcrypt.hash(password, 10);

    // 3. Create User
    const user = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        name: company_name || email.split('@')[0],
        company_name: company_name || "",
        is_approved: false // Require admin approval by default
      }
    });

    return NextResponse.json({ success: true, userId: user.id });
  } catch (error) {
    console.error("Signup Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
