import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { r2Client } from '@/lib/r2';
import { PutObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

const BUCKET_NAME = process.env.R2_BUCKET_NAME || 'albumflow';

export async function POST(request, { params }) {
  const { id } = params;
  
  // Verify photographer authentication
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { filename, contentType } = await request.json();
  const fileKey = `events/${id}/${Date.now()}-${filename.replace(/[^a-zA-Z0-9.-]/g, '_')}`;

  try {
    const command = new PutObjectCommand({
      Bucket: BUCKET_NAME,
      Key: fileKey,
      ContentType: contentType,
    });

    const signedUrl = await getSignedUrl(r2Client, command, { expiresIn: 3600 });
    
    // Construct the public URL (ensure R2_PUBLIC_DOMAIN is set in .env)
    const domain = process.env.R2_PUBLIC_DOMAIN || 'r2.example.com';
    const publicUrl = `https://${domain}/${fileKey}`;

    // Seed the photo record in Supabase
    const { data: photoData, error } = await supabase.from('photos').insert([
        { event_id: id, url: publicUrl, thumbnail_url: publicUrl }
    ]).select().single();

    if (error) throw error;

    return NextResponse.json({ signedUrl, photo: photoData });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
