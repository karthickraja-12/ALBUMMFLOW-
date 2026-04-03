import { google } from 'googleapis';
import { NextResponse } from 'next/server';

export async function GET() {
  const oauth2Client = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    'http://localhost:3000/api/auth/google/callback'
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
