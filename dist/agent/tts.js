import { ElevenLabsClient } from "elevenlabs";
import { config } from "../config.js";
import fs from "fs";
import path from "path";
const elevenlabs = new ElevenLabsClient({ apiKey: config.ELEVENLABS_API_KEY });
// Usaremos la voz de "Rachel" por defecto, o puedes cambiarla a la ID de la voz que prefieras en ElevenLabs
const DEFAULT_VOICE_ID = "EXAVITQu4vr4xnSDxMaL";
export const generateAudioFromText = async (text) => {
    try {
        const audioStream = await elevenlabs.generate({
            voice: DEFAULT_VOICE_ID,
            model_id: "eleven_multilingual_v2",
            text: text,
            output_format: "mp3_44100_128", // Formato ideal para ogg/mp3 en Telegram
        });
        const tempFilePath = path.join(process.cwd(), `response_${Date.now()}.mp3`);
        const fileStream = fs.createWriteStream(tempFilePath);
        for await (const chunk of audioStream) {
            fileStream.write(chunk);
        }
        fileStream.end();
        return tempFilePath;
    }
    catch (error) {
        console.error("Error generando audio con ElevenLabs:", error);
        throw new Error(`Fallo en síntesis de voz: ${error.message}`);
    }
};
