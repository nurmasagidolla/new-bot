import type { Bot } from 'grammy';
import { checkRateLimit } from '../rate-limiter';

export function installRateLimit(bot: Bot): void {
  bot.use(async (ctx, next) => {
    const userId = ctx.from?.id;
    if (userId && !checkRateLimit(userId)) return;
    await next();
  });
}