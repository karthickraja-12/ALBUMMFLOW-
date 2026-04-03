import { NextResponse } from 'next/server';
import { google } from 'googleapis';
import { createClient } from '@/lib/supabase-server';

let ALBUMFLOW_ROOT_ID = null;

export async function POST(request, { params }) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id: eventId } = await params;
  const { filename, mimeType, eventName } = await request.json();

  try {
    const fs = require('fs');
    const path = require('path');
    const keyPath = path.join(process.cwd(), 'gcp-keys.json');
    const credentials = JSON.parse(fs.readFileSync(keyPath, 'utf8'));

    const auth = google.auth.fromJSON(credentials);
    auth.scopes = ['https://www.googleapis.com/auth/drive'];

    await auth.authorize();
    const drive = google.drive({ version: 'v3', auth });

    // 1. Locate root folder mathematically linked to User Drive
    if (!ALBUMFLOW_ROOT_ID) {
      const rootRes = await drive.files.list({
        q: "mimeType='application/vnd.google-apps.folder' and name='AlbumFlow_Originals' and trashed=false",
        fields: 'files(id, name)'
      });
      if (rootRes.data.files.length === 0) {
        return NextResponse.json({ error: 'Cannot find AlbumFlow_Originals folder in your Google Drive. Make sure it is legally shared with the Service Account as Editor.' }, { status: 400 });
      }
      ALBUMFLOW_ROOT_ID = rootRes.data.files[0].id;
    }

    // 2. Discover/Create Subfolder exclusively for this specific Event
    const folderName = `${eventName}_Originals`;
    let eventFolderId = null;

    const folderRes = await drive.files.list({
      q: `mimeType='application/vnd.google-apps.folder' and name='${folderName}' and '${ALBUMFLOW_ROOT_ID}' in parents and trashed=false`,
      fields: 'files(id)'
    });

    if (folderRes.data.files.length > 0) {
      eventFolderId = folderRes.data.files[0].id;
    } else {
      const newFolder = await drive.files.create({
        requestBody: { name: folderName, mimeType: 'application/vnd.google-apps.folder', parents: [ALBUMFLOW_ROOT_ID] },
        fields: 'id'
      });
      eventFolderId = newFolder.data.id;
    }

    const { token } = await auth.getAccessToken();
    if (!token) throw new Error("Google Auth failed to generate a fresh Access Token.");

    return NextResponse.json({ 
      accessToken: token, 
      eventFolderId: eventFolderId 
    });
  } catch (error) {
    console.error("GDRIVE ERROR:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
