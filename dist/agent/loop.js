import { runLLM } from './llm.js';
import { memory } from '../memory/db.js';
import { executeTool } from '../tools/index.js';
import { generateAudioFromText } from '../agent/tts.js';
const MAX_ITERATIONS = 5;
export const processUserMessage = async (userId, userMessage, forceAudio = false) => {
    // 1. Añadir mensaje de usuario a Firebase
    await memory.addMessage(userId, 'user', userMessage);
    // 2. Extraer historial del usuario para darle contexto al LLM
    // Obtenemos los últimos 20 mensajes. Los parseamos quitando el ID
    // para dárselo en el formato "role" y "content" que espera la API
    const rawHistory = await memory.getMessages(userId, 20);
    const contextMessages = rawHistory.map(row => ({
        role: row.role === 'tool' ? 'system' : row.role,
        content: row.content
    }));
    let iterations = 0;
    // 3. Iniciar el bucle de "Razonamiento"
    while (iterations < MAX_ITERATIONS) {
        iterations++;
        // Llamar al LLM con el contexto acumulado
        const responseMsg = await runLLM(contextMessages);
        // Comprobar si el modelo quiere hacer una llamada a una herramienta
        if (responseMsg.tool_calls && responseMsg.tool_calls.length > 0) {
            const toolCall = responseMsg.tool_calls[0];
            const functionName = toolCall.function.name;
            let args = {};
            try {
                args = JSON.parse(toolCall.function.arguments || '{}');
            }
            catch (e) {
                console.error("Error parseando argumentos de la herramienta:", e);
            }
            console.log(`[Agente] 🛠️ Intentando usar herramienta: ${functionName}`, args);
            // Añadir al contexto la petición de herramienta (para no perder el hilo)
            contextMessages.push(responseMsg);
            // Ejecutar la función
            const toolResult = await executeTool(functionName, args);
            // Añadir el resultado al contexto
            contextMessages.push({
                role: "tool",
                tool_call_id: toolCall.id,
                name: functionName,
                content: toolResult
            });
            // --- LOGICA DE PARADA PARA SUPERPODERES ---
            // Si la herramienta es de interacción (preguntas o planes), paramos el bucle
            // para que el bot no se responda a sí mismo y el usuario pueda leer el mensaje.
            if (functionName === 'start_brainstorming' || functionName === 'write_implementation_plan') {
                // Agregamos un mensaje final "ficticio" para que el loop termine limpiamente
                const finalMsg = toolResult;
                await memory.addMessage(userId, 'assistant', finalMsg);
                return { text: finalMsg };
            }
            // Volvemos arriba en el bucle para que el LLM analice la respuesta de la herramienta
            continue;
        }
        // Si terminó y no solicitó herramientas, es nuestra respuesta final al usuario.
        const finalContent = responseMsg.content || "Lo siento, no logré generar una respuesta coherente.";
        // Agregar respuesta a la base de datos
        await memory.addMessage(userId, 'assistant', finalContent);
        // Si debemos forzar audio, lo generamos aquí
        let audioPath = undefined;
        if (forceAudio) {
            try {
                audioPath = await generateAudioFromText(finalContent);
            }
            catch (err) {
                console.error("Fallo forzando audio, fallback a texto", err);
            }
        }
        return { text: finalContent, audioPath };
    }
    const failMsg = "He alcanzado el límite de iteraciones intentando procesar tu orden. Por favor, sé más específico o intenta más tarde.";
    await memory.addMessage(userId, 'assistant', failMsg);
    return { text: failMsg };
};
