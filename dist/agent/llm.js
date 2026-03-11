import Groq from 'groq-sdk';
import { config } from '../config.js';
import { getFunctionsForLLM } from '../tools/index.js';
import fs from 'fs';
const groq = new Groq({ apiKey: config.GROQ_API_KEY });
const callOpenRouter = async (messages, tools) => {
    if (!config.OPENROUTER_API_KEY || config.OPENROUTER_API_KEY.includes('...')) {
        throw new Error("OPENROUTER_API_KEY no configurado o inválido.");
    }
    const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
        method: "POST",
        headers: {
            "Authorization": `Bearer ${config.OPENROUTER_API_KEY}`,
            "Content-Type": "application/json"
        },
        body: JSON.stringify({
            model: config.OPENROUTER_MODEL,
            messages,
            tools: tools.length > 0 ? tools : undefined,
            tool_choice: "auto"
        })
    });
    if (!response.ok) {
        const errText = await response.text();
        throw new Error(`Error HTTP OpenRouter: ${response.status} - ${errText}`);
    }
    return response.json();
};
export const runLLM = async (messages) => {
    const systemPrompt = {
        role: "system",
        content: `Eres OpenGravity, un ingeniero de software experto.
    
REGLAS CRÍTICAS:
1. Usa SIEMPRE el protocolo JSON estándar para llamar a herramientas.
2. NO uses etiquetas XML como <function> o </function>.
3. Si vas a usar 'start_brainstorming' o 'write_implementation_plan', hazlo y DETENTE inmediatamente para que el usuario responda.
4. Tu prioridad es ser técnico, directo y resolver el problema del usuario.`
    };
    const payloadMessages = [systemPrompt, ...messages];
    const tools = getFunctionsForLLM();
    try {
        const response = await groq.chat.completions.create({
            model: 'llama-3.3-70b-versatile',
            messages: payloadMessages,
            tools: tools.length > 0 ? tools : undefined,
            tool_choice: 'auto',
            temperature: 0
        });
        return response.choices[0].message;
    }
    catch (error) {
        console.warn("⚠️ Error Groq:", error.message);
        if (config.OPENROUTER_API_KEY && !config.OPENROUTER_API_KEY.includes('...')) {
            try {
                const orResponse = await callOpenRouter(payloadMessages, tools);
                return orResponse.choices[0].message;
            }
            catch (orError) {
                throw new Error(`Fallo total. Groq: ${error.message}. OR: ${orError.message}`);
            }
        }
        throw new Error(`Error de comunicación con IA: ${error.message}`);
    }
};
export const transcribeAudio = async (filePath) => {
    try {
        const response = await groq.audio.transcriptions.create({
            file: fs.createReadStream(filePath),
            model: 'whisper-large-v3',
        });
        return response.text;
    }
    catch (error) {
        console.error("Error transcribiendo audio:", error);
        throw new Error(`Fallo en transcripción: ${error.message}`);
    }
};
