import { config } from './config.js';
import { bot } from './bot/telegram.js';
import { SkillsManager } from './agent/skills_manager.js';
import http from 'http';

async function bootstrap() {
  // Servidor HTTP básico para satisfacer el health check de Render
  const port = process.env.PORT || 3000;
  http.createServer((req, res) => {
    res.writeHead(200, { 'Content-Type': 'text/plain' });
    res.end('OpenGravity Agent is running\n');
  }).listen(port, () => {
    console.log(`🌐 Servidor de salud activo en el puerto ${port}`);
  });

  console.log("=========================================");
  console.log("🚀 Iniciando OpenGravity Agent...");
  
  // Cargar biblioteca de Superpoderes (Skills)
  await SkillsManager.loadAllSkills();
  console.log("⚡ Superpoderes cargados correctamente.");

  console.log(`🛡️ Whitelist de Telegram: Usuarios [${config.TELEGRAM_ALLOWED_USER_IDS.join(', ')}]`);
  console.log(`💾 Base de datos: ${config.DB_PATH}`);
  console.log("=========================================\n");

  bot.catch((err) => {
    console.error("❌ Error no capturado en Grammy:", err.error);
  });

  // Arrancar bot usando Long Polling para no depender de un servidor web/webhooks
  bot.start({
    onStart: (botInfo) => {
      console.log(`✅ Conexión con Telegram exitosa. Agente operativo como @${botInfo.username}`);
    }
  });

  // Manejar caídas seguras (Ctrl + C)
  process.once('SIGINT', () => {
    console.log("Apagando OpenGravity...");
    bot.stop();
  });
  process.once('SIGTERM', () => {
    console.log("Apagando OpenGravity...");
    bot.stop();
  });
}

bootstrap();
