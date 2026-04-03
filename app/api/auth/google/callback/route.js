import { google } from 'googleapis';
import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase-server';

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get('code');

  if (!code) {
    return NextResponse.redirect(new URL('/dashboard/settings?error=no_code', request.url));
  }

  try {
    const oauth2Client = new google.auth.OAuth2(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET,
      'http://localhost:3000/api/auth/google/callback'
    );

    const { tokens } = await oauth2Client.getToken(code);
    
    if (!tokens.refresh_token) {
      // If we don't get a refresh token, it's usually because the user already authorized.
      // We might want to warn them or handle it.
      console.warn("No refresh token returned. User might already be authorized.");
    }

    // Save refresh_token to user's profile
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (user && tokens.refresh_token) {
      const { error } = await supabase
        .from('profiles')
        .update({ google_refresh_token: tokens.refresh_token })
        .eq('id', user.id);
      
      if (error) throw error;
    }

    return NextResponse.redirect(new URL('/dashboard/settings?sync=success', request.url));
  } catch (error) {
    console.error('Google OAuth Callback Error:', error);
    return NextResponse.redirect(new URL(`/dashboard/settings?error=${encodeURIComponent(error.message)}`, request.url));
  }
}
