import fs from 'fs/promises';
import path from 'path';
export const workflowTools = [
    {
        name: 'start_brainstorming',
        description: 'Inicia una fase de lluvia de ideas para una nueva funcionalidad. Úsala para hacer preguntas socráticas al usuario y definir el diseño.',
        parameters: {
            type: 'object',
            properties: {
                questions: {
                    type: 'array',
                    items: { type: 'string' },
                    description: 'Lista de 2 o 3 preguntas para aclarar requisitos.'
                }
            },
            required: ['questions']
        },
        execute: async ({ questions }) => {
            return `FASE DE BRAINSTORMING INICIADA.\n\nPreguntas para el usuario:\n${questions.map((q, i) => `${i + 1}. ${q}`).join('\n')}\n\nResponde a estas preguntas para proceder al plan de implementación.`;
        }
    },
    {
        name: 'write_implementation_plan',
        description: 'Genera un plan de implementación detallado en un archivo Markdown una vez que el diseño está claro.',
        parameters: {
            type: 'object',
            properties: {
                goal: { type: 'string', description: 'El objetivo principal del cambio.' },
                tasks: {
                    type: 'array',
                    items: {
                        type: 'object',
                        properties: {
                            description: { type: 'string' },
                            files: { type: 'array', items: { type: 'string' } },
                            step: { type: 'string' }
                        }
                    }
                }
            },
            required: ['goal', 'tasks']
        },
        execute: async ({ goal, tasks }) => {
            const planPath = path.join(process.cwd(), 'current_plan.md');
            let planContent = `# Plan de Implementación: ${goal}\n\n`;
            tasks.forEach((t, i) => {
                planContent += `## Tarea ${i + 1}: ${t.description}\n`;
                planContent += `- **Archivos:** ${t.files.join(', ')}\n`;
                planContent += `- **Paso:** ${t.step}\n\n`;
            });
            await fs.writeFile(planPath, planContent);
            return `✅ Plan de implementación guardado en 'current_plan.md'. Infórmale al usuario que el plan está listo y pregúntale si puedes proceder a la ejecución.`;
        }
    }
];
