import { z } from 'zod';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

// Cargar variables de entorno (útil si no vienen cargadas por el entorno de ejecución)
dotenv.config();

const envSchema = z.object({
  TELEGRAM_BOT_TOKEN: z.string().min(1, "El token del bot es obligatorio"),
  TELEGRAM_ALLOWED_USER_IDS: z.string().transform(val => 
    val.split(',').map(id => parseInt(id.trim(), 10)).filter(id => !isNaN(id))
  ),
  GROQ_API_KEY: z.string().min(1, "La clave de Groq es obligatoria"),
  OPENROUTER_API_KEY: z.string().optional(),
  OPENROUTER_MODEL: z.string().default('openrouter/free'),
  ELEVENLABS_API_KEY: z.string().min(1, "La clave de ElevenLabs es obligatoria"),
  DB_PATH: z.string().default('./memory.db'),
  GOOGLE_APPLICATION_CREDENTIALS: z.string().min(1, "La ruta a las credenciales de Firebase es obligatoria")
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  console.error("❌ Variables de entorno inválidas o faltantes:");
  console.error(parsed.error.format());
  process.exit(1);
}

export const config = parsed.data;
