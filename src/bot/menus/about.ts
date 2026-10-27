import type { Bot } from 'grammy';
import { config } from '../../config';
import { getTranslation, getUserLang } from '../../i18n';
import { setLastBotMessage } from '../message-tracker';

export function installAbout(bot: Bot): void {
  bot.callbackQuery('menu_about', async (ctx) => {
    await ctx.answerCallbackQuery();
    const userId = ctx.from?.id;
    if (!userId) return;
    const lang = await getUserLang(userId);

    await ctx.editMessageText(
      `<b>${getTranslation(lang, 'about.title')}</b>\n\n${getTranslation(lang, 'about.text')}`,
      {
        parse_mode: 'HTML',
        reply_markup: {
          inline_keyboard: [
            [
              {
                text: getTranslation(lang, 'buttons.site'),
                url: `${config.siteUrl}?utm_source=telegram&utm_medium=bot&utm_campaign=about`,
              },
            ],
            [
              { text: getTranslation(lang, 'buttons.back'), callback_data: 'menu_back' },
              { text: getTranslation(lang, 'buttons.menu'), callback_data: 'menu_home' },
            ],
          ],
        },
      },
    );
    setLastBotMessage(userId, ctx.callbackQuery!.message!.message_id);
  });
}