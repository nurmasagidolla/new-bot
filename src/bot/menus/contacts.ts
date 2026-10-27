import type { Bot } from 'grammy';
import { config } from '../../config';
import { getTranslation, getUserLang } from '../../i18n';
import { setLastBotMessage } from '../message-tracker';

export function installContacts(bot: Bot): void {
  bot.callbackQuery('menu_contacts', async (ctx) => {
    await ctx.answerCallbackQuery();
    const userId = ctx.from?.id;
    if (!userId) return;
    const lang = await getUserLang(userId);

    const text = getTranslation(lang, 'contacts.text', { studio: config.studioTelegram });

    await ctx.editMessageText(
      `<b>${getTranslation(lang, 'contacts.title')}</b>\n\n${text}`,
      {
        parse_mode: 'HTML',
        reply_markup: {
          inline_keyboard: [
            [
              {
                text: getTranslation(lang, 'buttons.write'),
                url: `https://t.me/${config.studioTelegram}`,
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