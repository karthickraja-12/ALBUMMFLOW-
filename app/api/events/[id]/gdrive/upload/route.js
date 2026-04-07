import { NextResponse } from "next/server";
import { google } from "googleapis";
import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { Readable } from "stream";

export async function POST(request, { params }) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id: eventId } = await params;
  const searchParams = request.nextUrl.searchParams;
  const filename = searchParams.get("filename");
  const mimeType = searchParams.get("mimeType");
  const eventName = searchParams.get("eventName");

  try {
    // 0. Fetch Photographer Profile for Personal GDrive Token
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { google_refresh_token: true }
    });

    const refreshToken = user?.google_refresh_token;

    if (!refreshToken) {
      throw new Error("Google Drive not connected. Please relink in Studio Settings.");
    }

    const oauth2Client = new google.auth.OAuth2(
      (process.env.GOOGLE_CLIENT_ID || "").trim(),
      (process.env.GOOGLE_CLIENT_SECRET || "").trim(),
      (process.env.GOOGLE_REDIRECT_URI || "").trim()
    );
    oauth2Client.setCredentials({
      refresh_token: refreshToken
    });

    const drive = google.drive({ version: "v3", auth: oauth2Client });

    // 1. Locate or Create root folder ("AlbumFlow_Originals")
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

    // 2. Discover/Create Event Subfolder with UUID suffix for collision safety
    const folderName = `${eventName}_${eventId.slice(0, 5)}_Originals`;
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

    // 3. ZERO-MEMORY STREAMING PIPE
    const nodeStream = Readable.fromWeb(request.body);

    const uploadRes = await drive.files.create({
      requestBody: {
        name: filename,
        parents: [eventFolderId]
      },
      media: {
        mimeType: mimeType,
        body: nodeStream
      },
      fields: "id"
    });

    return NextResponse.json({ success: true, googleFileId: uploadRes.data.id });
  } catch (error) {
    console.error("GDRIVE STREAM ERROR:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
