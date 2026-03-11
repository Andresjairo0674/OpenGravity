import { google } from 'googleapis';
import { authorizeGoogleApi } from '../google/auth.js';

export const getUpcomingEventsTool = {
  name: 'get_upcoming_events',
  description: 'Consulta los próximos 10 eventos o reuniones en el calendario de Google del usuario.',
  parameters: {
    type: 'object',
    properties: {},
    required: []
  },
  execute: async () => {
    try {
      const auth = await authorizeGoogleApi();
      const calendar = google.calendar({ version: 'v3', auth });
      
      const res = await calendar.events.list({
        calendarId: 'primary',
        timeMin: (new Date()).toISOString(),
        maxResults: 10,
        singleEvents: true,
        orderBy: 'startTime',
      });

      const events = res.data.items || [];
      if (events.length === 0) {
        return "No tienes eventos próximos programados.";
      }

      let summary = "📅 Próximos eventos en tu agenda:\n\n";
      
      events.forEach((event) => {
        const start = event.start?.dateTime || event.start?.date;
        summary += `🕒 ${start} - 📌 ${event.summary}\n`;
      });

      return summary;
    } catch (error: any) {
      console.error("Error en get_upcoming_events:", error);
      return `Error leyendo calendario: ${error.message}`;
    }
  }
};
