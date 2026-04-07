import { google } from "googleapis";
import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get("code");

  if (!code) {
    return NextResponse.redirect(new URL("/dashboard/settings?error=no_code", request.url));
  }

  try {
    const oauth2Client = new google.auth.OAuth2(
      (process.env.GOOGLE_CLIENT_ID || "").trim(),
      (process.env.GOOGLE_CLIENT_SECRET || "").trim(),
      (process.env.GOOGLE_REDIRECT_URI || "").trim()
    );

    const { tokens } = await oauth2Client.getToken(code);

    if (!tokens.refresh_token) {
      console.warn("No refresh token returned. User already authorized.");
      return NextResponse.redirect(new URL("/dashboard/settings?error=missing_token&reconnect=true", request.url));
    }

    const session = await auth();
    if (session?.user?.id && tokens.refresh_token) {
      // 1. Save Refresh Token to RDS User Model
      await prisma.user.update({
        where: { id: session.user.id },
        data: {
          google_refresh_token: tokens.refresh_token,
          google_access_token: tokens.access_token || null
        }
      });
    } else {
      return NextResponse.redirect(new URL("/dashboard/settings?error=session_loss", request.url));
    }

    return NextResponse.redirect(new URL("/dashboard/settings?sync=success", request.url));
  } catch (error) {
    console.error("Google OAuth Callback Error:", error);
    return NextResponse.redirect(new URL(`/dashboard/settings?error=${encodeURIComponent(error.message)}`, request.url));
  }
}
