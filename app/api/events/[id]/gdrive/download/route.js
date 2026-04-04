import { NextResponse } from 'next/server';
import { google } from 'googleapis';
import { createClient } from '@/lib/supabase-server';

export async function POST(request, { params }) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id: eventId } = await params;
  const { photoData, eventName } = await request.json();

  try {
    // 0. Fetch Photographer Profile for Personal GDrive Token
    const { data: profile } = await supabase
      .from('profiles')
      .select('google_refresh_token')
      .eq('id', user.id)
      .single();

    const refreshToken = profile?.google_refresh_token;

    if (!refreshToken) {
      return NextResponse.json({ error: 'Google Drive is not connected. Please go to Settings and click "Connect Archive".' }, { status: 400 });
    }

    const auth = new google.auth.OAuth2(
      (process.env.GOOGLE_CLIENT_ID || '').trim(),
      (process.env.GOOGLE_CLIENT_SECRET || '').trim(),
      (process.env.GOOGLE_REDIRECT_URI || '').trim()
    );
    auth.setCredentials({ refresh_token: refreshToken });

    const drive = google.drive({ version: 'v3', auth });

    // 1. Ensure Root Folder exists
    let rootFolderId = null;
    const rootRes = await drive.files.list({
      q: "mimeType='application/vnd.google-apps.folder' and name='AlbumFlow_Originals' and trashed=false",
      fields: 'files(id)'
    });
    if (rootRes.data.files.length > 0) {
      rootFolderId = rootRes.data.files[0].id;
    } else {
      const newRoot = await drive.files.create({
        requestBody: { name: 'AlbumFlow_Originals', mimeType: 'application/vnd.google-apps.folder' },
        fields: 'id'
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
      fields: 'files(id)'
    });
    const originalsId = originalsRes.data.files[0]?.id;

    // Find or Create Winners Folder
    let winnersFolderId = null;
    const winnersRes = await drive.files.list({
      q: `mimeType='application/vnd.google-apps.folder' and name='${winnersFolderName}' and '${rootFolderId}' in parents and trashed=false`,
      fields: 'files(id)'
    });
    if (winnersRes.data.files.length > 0) {
      winnersFolderId = winnersRes.data.files[0].id;
    } else {
      const newWinners = await drive.files.create({
        requestBody: { name: winnersFolderName, mimeType: 'application/vnd.google-apps.folder', parents: [rootFolderId] },
        fields: 'id'
      });
      winnersFolderId = newWinners.data.id;
    }

    // 3. Gather candidate files for matching
    let candidateFiles = [];
    if (originalsId) {
      console.log(`Searching for finalists in Originals folder: ${originalsId}`);
      // Prioritize files in the Originals folder
      const folderFiles = await drive.files.list({
        q: `'${originalsId}' in parents and trashed=false`,
        fields: 'files(id, name, parents, webContentLink)',
        pageSize: 1000
      });
      candidateFiles = folderFiles.data.files || [];
    }

    // If no files in folder (or folder missing), check the root as fallback for legacy photos
    if (candidateFiles.length === 0) {
      const rootFiles = await drive.files.list({
        q: `'${rootFolderId}' in parents and trashed=false and mimeType != 'application/vnd.google-apps.folder'`,
        fields: 'files(id, name, parents, webContentLink)',
        pageSize: 1000
      });
      candidateFiles = rootFiles.data.files;
    }

    const downloadLinks = [];
    const moveOperations = photoData.map(async (photo) => {
      const { googleFileId, filename } = photo;
      
      let targetFileId = googleFileId;
      let matchedFile = null;

      // 1. If we have a Google File ID, try to use it directly
      if (targetFileId) {
        try {
          const res = await drive.files.get({ fileId: targetFileId, fields: 'id, name, parents, webContentLink' });
          matchedFile = res.data;
        } catch (e) {
          console.warn(`File ID ${targetFileId} not found, falling back to name match...`);
          targetFileId = null;
        }
      }

      // 2. Fallback to filename matching if ID is missing or invalid
      if (!matchedFile) {
        const lowerTarget = filename.toLowerCase();
        matchedFile = candidateFiles.find(f => {
           const driveNameLower = f.name.toLowerCase();
           const sanitizedDriveName = f.name.replace(/[^a-zA-Z0-9.-]/g, '_').toLowerCase();
           return driveNameLower === lowerTarget || sanitizedDriveName === lowerTarget;
        });
      }

      if (matchedFile) {
        console.log(`Matched finalist: ${matchedFile.name}`);
        if (matchedFile.webContentLink) downloadLinks.push(matchedFile.webContentLink);

        // Move to winners folder
        const previousParents = (matchedFile.parents || []).join(',');
        
        const updateParams = {
          fileId: matchedFile.id,
          addParents: winnersFolderId,
          fields: 'id, parents'
        };

        if (previousParents) {
          updateParams.removeParents = previousParents;
        }

        await drive.files.update(updateParams);
        return true;
      } else {
        console.warn(`Failed to match finalist: ${filename}`);
        return false;
      }
    });

    const results = await Promise.all(moveOperations);
    const matchedCount = results.filter(Boolean).length;

    if (matchedCount === 0) {
      return NextResponse.json({ error: 'Could not match any finalist photos natively in Google Drive.' }, { status: 404 });
    }

    // 4. Mark Event as Finalized in DB
    await supabase.from('events').update({ is_finalized: true }).eq('id', eventId);

    // 5. Cleanup: Delete the Originals folder if it exists
    if (originalsId && matchedCount > 0) {
      console.log(`Cleaning up Originals folder ${originalsId}...`);
      await drive.files.delete({ fileId: originalsId });
    }

    return NextResponse.json({ 
      success: true, 
      message: `Successfully moved ${matchedCount} photos to the Winners folder and cleaned up originals.`,
      links: downloadLinks 
    });

  } catch (error) {
    console.error("GDrive Move Error", error);
    let message = error.message;
    if (message.includes('unauthorized_client')) {
      message = "Google Authentication Failed (Unauthorized Client). This usually refers to incorrect Client ID or Secret in Vercel. Please double check your Environment Variables and Redeploy.";
    } else if (message.includes('deleted_client')) {
      message = "Critical Error: Your Google OAuth Client has been deleted. Please create a new Web Client in Google Cloud Console, update Vercel, and Reconnect.";
    }
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
