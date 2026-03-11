import { getCurrentTimeTool } from './time.js';
import { workflowTools } from './workflow.js';

export const tools = [
  getCurrentTimeTool,
  ...workflowTools
];

export const getFunctionsForLLM = () => {
  return tools.map(t => ({
    type: "function" as const,
    function: {
      name: t.name,
      description: t.description,
      parameters: t.parameters
    }
  }));
};

export const executeTool = async (name: string, args: any): Promise<string> => {
  const tool = tools.find(t => t.name === name);
  if (!tool) {
    throw new Error(`Herramienta no encontrada: ${name}`);
  }
  
  try {
    const result = await tool.execute(args); // Pasar argumentos correctamente
    return typeof result === 'string' ? result : JSON.stringify(result);
  } catch (error: any) {
    console.error(`Error ejecutando herramienta ${name}:`, error);
    return `Error: ${error.message}`;
  }
};
