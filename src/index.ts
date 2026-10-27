import 'dotenv/config';
import { config } from './config';
import { initDb } from './schema';
import { initExtraTables, cleanupOldData } from './db-queries';
import { logger } from './logger';
import { createBot } from './bot';
import { createPanelServer } from './api';

async function main() {
  // 1. База
  initDb();
  await initExtraTables();

  // 2. Бот
  const bot = createBot();

  // 3. Диагностика: getMe с таймаутом
  try {
    const me = await Promise.race([
      bot.api.getMe(),
      new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error('getMe timeout 15s')), 15_000),
      ),
    ]);
    logger.info(`getMe OK: @${me.username}`);
  } catch (e) {
    logger.error('Cannot reach Telegram', e);
    process.exit(1);
  }

  // 4. Меню команд
  try {
    await bot.api.setMyCommands(
      [
        { command: 'start',   description: 'Главное меню' },
        { command: 'menu',    description: 'Меню' },
        { command: 'brief',   description: 'Оставить заявку' },
        { command: 'contact', description: 'Написать нам' },
        { command: 'lang',    description: 'Сменить язык' },
        { command: 'privacy', description: 'Политика конфиденциальности' },
        { command: 'delete',  description: 'Удалить мои данные' },
        { command: 'help',    description: 'Помощь' },
      ],
      { scope: { type: 'default' }, language_code: 'ru' },
    );
    await bot.api.setMyCommands(
      [
        { command: 'start',   description: 'Main menu' },
        { command: 'menu',    description: 'Menu' },
        { command: 'brief',   description: 'Start a project' },
        { command: 'contact', description: 'Message us' },
        { command: 'lang',    description: 'Change language' },
        { command: 'privacy', description: 'Privacy policy' },
        { command: 'delete',  description: 'Delete my data' },
        { command: 'help',    description: 'Help' },
      ],
      { scope: { type: 'default' }, language_code: 'en' },
    );
    logger.info('Commands registered for ru and en');
  } catch (e) {
    logger.error('Failed to register commands', e);
  }

  // 5. HTTP API панели
  const server = createPanelServer();
  server.listen(config.panelApiPort, config.panelApiHost, () => {
    logger.info(`Panel API running on ${config.panelApiHost}:${config.panelApiPort}`);
  });

  // 6. Фоновая очистка
  setInterval(() => {
    cleanupOldData().catch((e) => logger.error('Cleanup failed', e));
  }, 60 * 60 * 1000);

  // 7. Graceful shutdown
  function shutdown(signal: string) {
    logger.info(`${signal} received, stopping`);
    setTimeout(() => process.exit(1), 5000).unref();
    Promise.resolve(bot.stop()).catch(() => {});
    server.close(() => process.exit(0));
  }

  process.on('SIGTERM', () => shutdown('SIGTERM'));
  process.on('SIGINT', () => shutdown('SIGINT'));
  process.on('unhandledRejection', (err) => {
    console.error('[FATAL] Unhandled rejection:', err);
    process.exit(1);
  });
  process.on('uncaughtException', (err) => {
    console.error('[FATAL] Uncaught exception:', err);
    process.exit(1);
  });

  // 8. Запуск
  await bot.start({
    onStart: (botInfo) => logger.info(`Cloutlab Telegram Bot started: @${botInfo.username}`),
  });
}

main().catch((err) => {
  console.error('[FATAL] main() failed:', err);
  process.exit(1);
});