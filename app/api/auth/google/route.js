import { google } from 'googleapis';
import { NextResponse } from 'next/server';

export async function GET() {
  const oauth2Client = new google.auth.OAuth2(
    (process.env.GOOGLE_CLIENT_ID || '').trim(),
    (process.env.GOOGLE_CLIENT_SECRET || '').trim(),
    (process.env.GOOGLE_REDIRECT_URI || '').trim()
  );

  const scopes = [
    'https://www.googleapis.com/auth/drive.file'
  ];

  const url = oauth2Client.generateAuthUrl({
    access_type: 'offline', // Critical for getting a refresh_token
    scope: scopes,
    prompt: 'consent' // Forces consent screen to ensure refresh_token is returned
  });

  return NextResponse.redirect(url);
}
