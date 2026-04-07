import { NextResponse } from "next/server";
import { google } from "googleapis";
import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";

export async function POST(request, { params }) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id: eventId } = await params;
  const { photoData, eventName } = await request.json();

  try {
    // 0. Fetch Photographer Profile for Personal GDrive Token
    const userProfile = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { google_refresh_token: true }
    });

    const refreshToken = userProfile?.google_refresh_token;

    if (!refreshToken) {
      return NextResponse.json(
        { error: 'Google Drive is not connected. Please go to Settings and click "Connect Archive".' },
        { status: 400 }
      );
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

    // 2. Discover/Locate existing folders with UUID suffix
    const folderSuffix = eventId.slice(0, 5);
    const originalsFolderName = `${eventName}_${folderSuffix}_Originals`;
    const winnersFolderName = `${eventName}_${folderSuffix}_Winners`;

    // Find Originals Folder ID
    const originalsRes = await drive.files.list({
      q: `mimeType='application/vnd.google-apps.folder' and name='${originalsFolderName}' and '${rootFolderId}' in parents and trashed=false`,
      fields: "files(id)"
    });
    const originalsId = originalsRes.data.files[0]?.id;

    // Find or Create Winners Folder
    let winnersFolderId = null;
    const winnersRes = await drive.files.list({
      q: `mimeType='application/vnd.google-apps.folder' and name='${winnersFolderName}' and '${rootFolderId}' in parents and trashed=false`,
      fields: "files(id)"
    });
    if (winnersRes.data.files && winnersRes.data.files.length > 0) {
      winnersFolderId = winnersRes.data.files[0].id;
    } else {
      const newWinners = await drive.files.create({
        requestBody: { name: winnersFolderName, mimeType: "application/vnd.google-apps.folder", parents: [rootFolderId] },
        fields: "id"
      });
      winnersFolderId = newWinners.data.id;
    }

    // 3. Gather candidate files for matching
    let candidateFiles = [];
    if (originalsId) {
      const folderFiles = await drive.files.list({
        q: `'${originalsId}' in parents and trashed=false`,
        fields: "files(id, name, parents, webContentLink)",
        pageSize: 1000
      });
      candidateFiles = folderFiles.data.files || [];
    }

    if (candidateFiles.length === 0) {
      const rootFiles = await drive.files.list({
        q: `'${rootFolderId}' in parents and trashed=false and mimeType != 'application/vnd.google-apps.folder'`,
        fields: "files(id, name, parents, webContentLink)",
        pageSize: 1000
      });
      candidateFiles = rootFiles.data.files || [];
    }

    const downloadLinks = [];
    const moveOperations = photoData.map(async (photo) => {
      const { googleFileId, filename } = photo;
      let matchedFile = null;

      if (googleFileId) {
        try {
          const res = await drive.files.get({ fileId: googleFileId, fields: "id, name, parents, webContentLink" });
          matchedFile = res.data;
        } catch (e) {
          console.warn(`File ID ${googleFileId} not found, falling back to name match...`);
        }
      }

      if (!matchedFile) {
        const lowerTarget = filename.toLowerCase();
        matchedFile = candidateFiles.find((f) => {
          const driveNameLower = f.name.toLowerCase();
          const sanitizedDriveName = f.name.replace(/[^a-zA-Z0-9.-]/g, "_").toLowerCase();
          return driveNameLower === lowerTarget || sanitizedDriveName === lowerTarget;
        });
      }

      if (matchedFile) {
        if (matchedFile.webContentLink) downloadLinks.push(matchedFile.webContentLink);

        const previousParents = (matchedFile.parents || []).join(",");
        const updateParams = {
          fileId: matchedFile.id,
          addParents: winnersFolderId,
          fields: "id, parents"
        };
        if (previousParents) updateParams.removeParents = previousParents;

        await drive.files.update(updateParams);
        return true;
      }
      return false;
    });

    const results = await Promise.all(moveOperations);
    const matchedCount = results.filter(Boolean).length;

    if (matchedCount === 0) {
      return NextResponse.json({ error: "Could not match any finalist photos natively in Google Drive." }, { status: 404 });
    }

    // 4. Mark Event as Finalized in RDS
    await prisma.event.update({
      where: { id: eventId },
      data: { is_finalized: true }
    });

    return NextResponse.json({
      success: true,
      message: `Successfully archived ${matchedCount} selection(s) to the Winners folder.`,
      links: downloadLinks
    });
  } catch (error) {
    console.error("GDrive Move Error", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
