import type { Bot } from 'grammy';
import { getUserLang } from '../../i18n';
import { showMainMenu } from './index';
import { setLastBotMessage } from '../message-tracker';

export function installNavigation(bot: Bot): void {
  bot.callbackQuery('menu_back', async (ctx) => {
    await ctx.answerCallbackQuery();
    const userId = ctx.from?.id;
    if (!userId) return;
    const lang = await getUserLang(userId);
    await showMainMenu(ctx, lang, true);
    setLastBotMessage(userId, ctx.callbackQuery!.message!.message_id);
  });

  bot.callbackQuery('menu_home', async (ctx) => {
    await ctx.answerCallbackQuery();
    const userId = ctx.from?.id;
    if (!userId) return;
    const lang = await getUserLang(userId);
    await showMainMenu(ctx, lang, true);
    setLastBotMessage(userId, ctx.callbackQuery!.message!.message_id);
  });
}