/**
 * ALBUMFLOW AI - GOOGLE DRIVE TOKEN GENERATOR
 * -------------------------------------------
 * RUN THIS ONCE to get your persistent REFRESH_TOKEN.
 * 
 * Instructions:
 * 1. Go to Google Cloud Console > APIs & Services > Credentials.
 * 2. Create "OAuth 2.0 Client ID" (Type: Desktop App).
 * 3. Download the JSON or copy the Client ID and Client Secret.
 * 4. Paste them into the config below.
 * 5. Run: node scripts/get-token.js
 */

const { google } = require('googleapis');
const readline = require('readline');

// PASTE YOUR CREDENTIALS HERE:
const CLIENT_ID = '427807669181-k7ifoojpojmcmg6lh6kaht59h9jtlm4m.apps.googleusercontent.com';
const CLIENT_SECRET = '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';
const REDIRECT_URI = 'urn:ietf:wg:oauth:2.0:oob'; // Standard for desktop apps

const oauth2Client = new google.auth.OAuth2(
  CLIENT_ID,
  CLIENT_SECRET,
  REDIRECT_URI
);

const SCOPES = ['https://www.googleapis.com/auth/drive.file', 'https://www.googleapis.com/auth/drive.metadata.readonly'];

const authUrl = oauth2Client.generateAuthUrl({
  access_type: 'offline', // CRITICAL: This gives us the REFRESH_TOKEN
  scope: SCOPES,
});

console.log('\n1. Open this URL in your browser:\n', authUrl);

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

rl.question('\n2. Enter the code from that page here: ', async (code) => {
  rl.close();
  try {
    const { tokens } = await oauth2Client.getToken(code);
    console.log('\n--- SUCCESS! ---');
    console.log('Copy this REFRESH_TOKEN to your .env.local file:');
    console.log('\nGOOGLE_REFRESH_TOKEN=' + tokens.refresh_token);
    console.log('GOOGLE_CLIENT_ID=' + CLIENT_ID);
    console.log('GOOGLE_CLIENT_SECRET=' + CLIENT_SECRET);
    console.log('\n----------------\n');
  } catch (e) {
    console.error('Error retrieving access token', e);
  }
});
