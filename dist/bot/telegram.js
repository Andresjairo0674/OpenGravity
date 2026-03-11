import { Bot } from 'grammy';
import { config } from '../config.js';
import { processUserMessage } from '../agent/loop.js';
import { transcribeAudio } from '../agent/llm.js';
import fs from 'fs';
import path from 'path';
import { InputFile } from 'grammy';
export const bot = new Bot(config.TELEGRAM_BOT_TOKEN);
// Middleware estricto: Validación de Whitelist por ID de Telegram
bot.use(async (ctx, next) => {
    const userId = ctx.from?.id;
    if (!userId)
        return;
    if (!config.TELEGRAM_ALLOWED_USER_IDS.includes(userId)) {
        console.warn(`[Seguridad] Bloqueado intento de acceso de usuario no autorizado: ID ${userId}`);
        // No respondemos intencionalmente para no dar feedback a extraños
        return;
    }
    await next();
});
bot.on('message:text', async (ctx) => {
    const userId = ctx.from.id;
    const text = ctx.message.text;
    // Notificamos a Telegram que estamos procesando ("Escribiendo...")
    await ctx.replyWithChatAction('typing');
    try {
        const res = await processUserMessage(userId, text);
        if (res.audioPath) {
            await ctx.replyWithVoice(new InputFile(res.audioPath), { caption: res.text });
            fs.unlinkSync(res.audioPath); // Limpiar
        }
        else {
            await ctx.reply(res.text);
        }
    }
    catch (error) {
        console.error("[Error] Falla general procesando mensaje de Telegram:", error);
        await ctx.reply(`⚠️ Ocurrió un error en mis sistemas internos: ${error.message}`);
    }
});
bot.on(['message:voice', 'message:audio'], async (ctx) => {
    const userId = ctx.from.id;
    await ctx.replyWithChatAction('typing');
    try {
        const file = await ctx.getFile();
        const url = `https://api.telegram.org/file/bot${config.TELEGRAM_BOT_TOKEN}/${file.file_path}`;
        // Notificar al usuario
        const statusMsg = await ctx.reply("🎙️ _Descargando y transcribiendo audio..._", { parse_mode: "Markdown" });
        // Descargar archivo
        const res = await fetch(url);
        const buffer = Buffer.from(await res.arrayBuffer());
        let ext = file.file_path?.split('.').pop() || 'ogg';
        if (ext === 'oga') {
            ext = 'ogg'; // Groq no acepta 'oga', pero es compatible bajo '.ogg'
        }
        const tempFilePath = path.join(process.cwd(), `temp_audio_${Date.now()}.${ext}`);
        fs.writeFileSync(tempFilePath, buffer);
        // Transcribir
        let text = "";
        try {
            text = await transcribeAudio(tempFilePath);
        }
        finally {
            // Limpiar archivo temporal
            if (fs.existsSync(tempFilePath)) {
                fs.unlinkSync(tempFilePath);
            }
        }
        if (!text || text.trim() === '') {
            await ctx.api.editMessageText(ctx.chat.id, statusMsg.message_id, "⚠️ No pude entender el audio o está vacío.");
            return;
        }
        // Actualizar mensaje de estado mostrando qué entendió
        await ctx.api.editMessageText(ctx.chat.id, statusMsg.message_id, `🗣️: _"${text}"_`, { parse_mode: "Markdown" });
        // Enrutar al agente indicando que esperamos audio ya que el usuario mandó audio
        const processRes = await processUserMessage(userId, text, true);
        if (processRes.audioPath) {
            await ctx.replyWithVoice(new InputFile(processRes.audioPath), { caption: processRes.text });
            fs.unlinkSync(processRes.audioPath);
        }
        else {
            await ctx.reply(processRes.text);
        }
    }
    catch (error) {
        console.error("[Error] Falla procesando audio de Telegram:", error);
        await ctx.reply(`⚠️ Ocurrió un error procesando el audio: ${error.message}`);
    }
});
