import fs from 'fs/promises';
import { google } from 'googleapis';

async function run() {
  try {
    const content = await fs.readFile('./credentials.json', 'utf-8');
    const credentials = JSON.parse(content);
    const { client_secret, client_id, redirect_uris } = credentials.installed || credentials.web;
    const oAuth2Client = new google.auth.OAuth2(client_id, client_secret, redirect_uris[0]);

    const authUrl = oAuth2Client.generateAuthUrl({
      access_type: 'offline',
      scope: [
        'https://www.googleapis.com/auth/gmail.readonly',
        'https://www.googleapis.com/auth/calendar.readonly'
      ],
    });

    console.log('---URL_START---');
    console.log(authUrl);
    console.log('---URL_END---');
  } catch (err) {
    console.error(err);
  }
}

run();
