import { NextResponse } from "next/server";
import { google } from "googleapis";
import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";

export async function POST(request, { params }) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id: eventId } = await params;
  const { eventName } = await request.json();

  try {
    // 0. Fetch Photographer Profile for Personal GDrive Token
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { google_refresh_token: true }
    });

    const refreshToken = user?.google_refresh_token;
    if (!refreshToken) {
      return NextResponse.json({ error: "Google Drive not connected." }, { status: 400 });
    }

    const oauth2Client = new google.auth.OAuth2(
      (process.env.GOOGLE_CLIENT_ID || "").trim(),
      (process.env.GOOGLE_CLIENT_SECRET || "").trim(),
      (process.env.GOOGLE_REDIRECT_URI || "").trim()
    );
    oauth2Client.setCredentials({ refresh_token: refreshToken });

    const drive = google.drive({ version: "v3", auth: oauth2Client });

    // 1. Ensure Root Folder exists
    let rootFolderId = null;
    const rootRes = await drive.files.list({
      q: "mimeType='application/vnd.google-apps.folder' and name='AlbumFlow_Originals' and trashed=false",
      fields: "files(id)"
    });
    if (rootRes.data.files && rootRes.data.files.length > 0) {
      rootFolderId = rootRes.data.files[0].id;
    } else {
      const newRoot = await drive.files.create({
        requestBody: { name: "AlbumFlow_Originals", mimeType: "application/vnd.google-apps.folder" },
        fields: "id"
      });
      rootFolderId = newRoot.data.id;
    }

    // 2. Locate or Create Event Folder
    const folderSuffix = eventId.slice(0, 5);
    const folderName = `${eventName}_${folderSuffix}_Originals`;
    let eventFolderId = null;

    const folderRes = await drive.files.list({
      q: `mimeType='application/vnd.google-apps.folder' and name='${folderName}' and '${rootFolderId}' in parents and trashed=false`,
      fields: "files(id)"
    });

    if (folderRes.data.files && folderRes.data.files.length > 0) {
      eventFolderId = folderRes.data.files[0].id;
    } else {
      const newFolder = await drive.files.create({
        requestBody: { name: folderName, mimeType: "application/vnd.google-apps.folder", parents: [rootFolderId] },
        fields: "id"
      });
      eventFolderId = newFolder.data.id;
    }

    const { token } = await oauth2Client.getAccessToken();
    return NextResponse.json({ 
      accessToken: token, 
      eventFolderId: eventFolderId 
    });
  } catch (error) {
    console.error("GDRIVE LIST ERROR:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
