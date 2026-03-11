import { google } from 'googleapis';
import { authorizeGoogleApi } from '../google/auth.js';
export const readRecentEmailsTool = {
    name: 'read_recent_emails',
    description: 'Lee los últimos 5 correos electrónicos del usuario para dar un resumen de lo que ha llegado.',
    parameters: {
        type: 'object',
        properties: {},
        required: []
    },
    execute: async () => {
        try {
            const auth = await authorizeGoogleApi();
            const gmail = google.gmail({ version: 'v1', auth });
            const res = await gmail.users.messages.list({
                userId: 'me',
                maxResults: 5,
            });
            const messages = res.data.messages || [];
            if (messages.length === 0) {
                return "No se encontraron correos recientes.";
            }
            let summary = "📧 Últimos correos recibidos:\n\n";
            for (const msg of messages) {
                const fullMsg = await gmail.users.messages.get({
                    userId: 'me',
                    id: msg.id,
                });
                const headers = fullMsg.data.payload?.headers;
                const subject = headers?.find(h => h.name === 'Subject')?.value || '(Sin asunto)';
                const from = headers?.find(h => h.name === 'From')?.value || '(Desconocido)';
                const snippet = fullMsg.data.snippet || '';
                summary += `🔹 De: ${from}\n🔸 Asunto: ${subject}\n📝: ${snippet}\n\n`;
            }
            return summary;
        }
        catch (error) {
            console.error("Error en read_recent_emails:", error);
            return `Error leyendo correos: ${error.message}`;
        }
    }
};
