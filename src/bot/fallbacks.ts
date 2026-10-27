import type { Bot } from 'grammy';
import { logger } from '../logger';

export function installFallbacks(bot: Bot): void {
  // Ловит все callback_data, которые не подошли под другие обработчики
  bot.on('callback_query:data', async (ctx) => {
    const data = ctx.callbackQuery.data;
    const userId = ctx.from?.id;
    if (typeof (logger as any).warn === 'function') {
      (logger as any).warn(`[UNHANDLED] callback="${data}" from=${userId}`);
    } else {
      logger.info(`[UNHANDLED] callback="${data}" from=${userId}`);
    }
    await ctx.answerCallbackQuery({ text: 'Кнопка устарела. Отправьте /start или /brief.' });
  });

  // Глобальный обработчик ошибок бота
  bot.catch((err) => {
    logger.error('[BOT ERROR]', err.error);
  });
}