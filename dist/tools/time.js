export const getCurrentTimeTool = {
    name: 'get_current_time',
    description: 'Obtiene la fecha y hora actual del sistema en formato ISO. Útil para responder preguntas sobre la hora actual, el día o la fecha.',
    parameters: {
        type: "object",
        properties: {},
        required: []
    },
    execute: async () => {
        return new Date().toISOString();
    }
};
