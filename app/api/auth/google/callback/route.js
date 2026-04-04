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
      (process.env.GOOGLE_CLIENT_ID || '').trim(),
      (process.env.GOOGLE_CLIENT_SECRET || '').trim(),
      (process.env.GOOGLE_REDIRECT_URI || '').trim()
    );

    const { tokens } = await oauth2Client.getToken(code);
    
    if (!tokens.refresh_token) {
      // If we don't get a refresh token, it's usually because the user already authorized without prompt=consent.
      console.warn("No refresh token returned. User already authorized.");
      return NextResponse.redirect(new URL('/dashboard/settings?error=missing_token&reconnect=true', request.url));
    }

    // Save refresh_token to user's profile
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (user && tokens.refresh_token) {
      const { error } = await supabase
        .from('profiles')
        .update({ 
          google_refresh_token: tokens.refresh_token,
          google_connected_at: new Date().toISOString()
        })
        .eq('id', user.id);
      
      if (error) throw error;
    }

    return NextResponse.redirect(new URL('/dashboard/settings?sync=success', request.url));
  } catch (error) {
    console.error('Google OAuth Callback Error:', error);
    return NextResponse.redirect(new URL(`/dashboard/settings?error=${encodeURIComponent(error.message)}`, request.url));
  }
}
