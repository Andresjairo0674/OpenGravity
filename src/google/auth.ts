import fs from 'fs/promises';
import path from 'path';
import process from 'process';
import { google } from 'googleapis';
import readline from 'readline';

const SCOPES = [
  'https://www.googleapis.com/auth/gmail.readonly',
  'https://www.googleapis.com/auth/calendar.readonly'
];

const TOKEN_PATH = path.join(process.cwd(), 'token.json');
const CREDENTIALS_PATH = path.join(process.cwd(), 'credentials.json');

async function loadSavedCredentialsIfExist() {
  try {
    const content = await fs.readFile(TOKEN_PATH, 'utf-8');
    const credentials = JSON.parse(content);
    return google.auth.fromJSON(credentials);
  } catch (err) {
    return null;
  }
}

async function saveCredentials(client: any) {
  const content = await fs.readFile(CREDENTIALS_PATH, 'utf-8');
  const keys = JSON.parse(content);
  const key = keys.installed || keys.web;
  
  const payload = JSON.stringify({
    type: 'authorized_user',
    client_id: key.client_id,
    client_secret: key.client_secret,
    refresh_token: client.credentials.refresh_token,
  });
  
  await fs.writeFile(TOKEN_PATH, payload);
}

export async function authorizeGoogleApi() {
  let client: any = await loadSavedCredentialsIfExist();
  
  if (client) {
    return client;
  }

  // Cargar credenciales desde disco
  let credentials;
  try {
    const content = await fs.readFile(CREDENTIALS_PATH, 'utf-8');
    credentials = JSON.parse(content);
  } catch (err) {
    console.error("❌ ERROR: No se encontró 'credentials.json'.");
    throw err;
  }

  const { client_secret, client_id, redirect_uris } = credentials.installed || credentials.web;
  const oAuth2Client = new google.auth.OAuth2(client_id, client_secret, redirect_uris[0]);

  const authUrl = oAuth2Client.generateAuthUrl({
    access_type: 'offline',
    scope: SCOPES,
  });

  console.log('🚀 AUTORIZACIÓN DE GOOGLE REQUERIDA 🚀');
  console.log('1. Abre este enlace en tu navegador:', authUrl);
  console.log('2. Autoriza la aplicación y copia el código que te den.');
  
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  return new Promise((resolve, reject) => {
    rl.question('3. Pega el código aquí y pulsa ENTER: ', async (code) => {
      rl.close();
      try {
        const { tokens } = await oAuth2Client.getToken(code);
        oAuth2Client.setCredentials(tokens);
        await saveCredentials(oAuth2Client);
        console.log("✅ Token guardado en 'token.json'");
        resolve(oAuth2Client);
      } catch (err) {
        console.error('❌ Error recuperando el token de acceso', err);
        reject(err);
      }
    });
  });
}
