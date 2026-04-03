import { NextResponse } from 'next/server';
import { google } from 'googleapis';
import { createClient } from '@/lib/supabase-server';
import { Readable } from 'stream';



export async function POST(request, { params }) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id: eventId } = await params;
  const searchParams = request.nextUrl.searchParams;
  const filename = searchParams.get('filename');
  const mimeType = searchParams.get('mimeType');
  const eventName = searchParams.get('eventName');

  try {
    // 0. Fetch Photographer Profile for Personal GDrive Token
    const { data: profile } = await supabase
      .from('profiles')
      .select('google_refresh_token')
      .eq('id', user.id)
      .single();

    const refreshToken = profile?.google_refresh_token || process.env.GOOGLE_REFRESH_TOKEN;

    const auth = new google.auth.OAuth2(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET
    );
    auth.setCredentials({
      refresh_token: refreshToken
    });

    const drive = google.drive({ version: 'v3', auth });

    // 1. Locate or Create root folder ("AlbumFlow_Originals")
    let rootFolderId = null;
    const rootRes = await drive.files.list({
      q: "mimeType='application/vnd.google-apps.folder' and name='AlbumFlow_Originals' and trashed=false",
      fields: 'files(id)'
    });

    if (rootRes.data.files.length > 0) {
      rootFolderId = rootRes.data.files[0].id;
    } else {
      // Create the root folder if it doesn't exist in the client's drive
      const newRoot = await drive.files.create({
        requestBody: { name: 'AlbumFlow_Originals', mimeType: 'application/vnd.google-apps.folder' },
        fields: 'id'
      });
      rootFolderId = newRoot.data.id;
    }

    // 2. Discover/Create Event Subfolder with UUID suffix for collision safety
    const folderName = `${eventName}_${eventId.slice(0, 5)}_Originals`;
    let eventFolderId = null;
    const folderRes = await drive.files.list({
      q: `mimeType='application/vnd.google-apps.folder' and name='${folderName}' and '${rootFolderId}' in parents and trashed=false`,
      fields: 'files(id)'
    });

    if (folderRes.data.files.length > 0) {
      eventFolderId = folderRes.data.files[0].id;
    } else {
      const newFolder = await drive.files.create({
        requestBody: { name: folderName, mimeType: 'application/vnd.google-apps.folder', parents: [rootFolderId] },
        fields: 'id'
      });
      eventFolderId = newFolder.data.id;
    }

    // 3. ZERO-MEMORY STREAMING PIPE
    // We convert the Web ReadableStream from the browser request into a Node Readable stream.
    // This allows the SDK to upload the 20MB file without it ever being loaded into the server's RAM.
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
      fields: 'id'
    });

    return NextResponse.json({ success: true, googleFileId: uploadRes.data.id });
  } catch (error) {
    console.error("GDRIVE STREAM ERROR:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
