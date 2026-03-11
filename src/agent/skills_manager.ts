import fs from 'fs/promises';
import path from 'path';
import { glob } from 'glob';

/**
 * Clase encargada de leer y proporcionar las instrucciones de "Skills" al Agente.
 */
export class SkillsManager {
  private static skillsContent: string = "";

  /**
   * Carga todas las Skills (.md) del directorio src/skills y las une en un bloque de texto.
   */
  static async loadAllSkills(): Promise<string> {
    const skillsDir = path.join(process.cwd(), 'src', 'skills');
    try {
      const files = await glob('**/*.md', { cwd: skillsDir, absolute: true });
      let combinedContent = "=== BIBLIOTECA DE SUPERPODERES (SKILLS) ===\n";
      
      for (const file of files) {
        const content = await fs.readFile(file, 'utf-8');
        const skillName = path.basename(file, '.md');
        combinedContent += `\n--- SKILL: ${skillName} ---\n${content}\n`;
      }
      
      this.skillsContent = combinedContent;
      return combinedContent;
    } catch (error) {
      console.error("Error cargando skills:", error);
      return "";
    }
  }

  static getLoadedSkills(): string {
    return this.skillsContent;
  }
}
