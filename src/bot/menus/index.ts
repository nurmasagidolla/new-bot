import type { Bot } from 'grammy';
import { getTranslation } from '../../i18n';
import type { Lang } from '../../types';
import { installServices } from './services';
import { installPricing } from './pricing';
import { installAbout } from './about';
import { installContacts } from './contacts';
import { installNavigation } from './navigation';
import { getLastBotMessage, setLastBotMessage } from '../message-tracker';

export async function showMainMenu(ctx: any, lang: Lang, edit = false): Promise<void> {
  const text = getTranslation(lang, 'welcome');

  const keyboard = [
    [
      { text: getTranslation(lang, 'menu.services'), callback_data: 'menu_services' },
      { text: getTranslation(lang, 'menu.about'), callback_data: 'menu_about' },
    ],
    [
      { text: getTranslation(lang, 'menu.contacts'), callback_data: 'menu_contacts' },
      { text: getTranslation(lang, 'menu.brief'), callback_data: 'brief_start' },
    ],
    [
      { text: getTranslation(lang, 'menu.subscribe'), callback_data: 'menu_subscribe' },
    ],
  ];

  const userId = ctx.from?.id;

  if (edit) {
    await ctx.editMessageText(text, {
      parse_mode: 'HTML',
      reply_markup: { inline_keyboard: keyboard },
    });
    if (userId) setLastBotMessage(userId, ctx.callbackQuery.message.message_id);
  } else {
    if (userId) {
      const prev = getLastBotMessage(userId);
      if (prev) {
        try {
          await ctx.api.deleteMessage(ctx.chat.id, prev);
        } catch {}
      }
    }
    const sent = await ctx.reply(text, {
      parse_mode: 'HTML',
      reply_markup: { inline_keyboard: keyboard },
    });
    if (userId) setLastBotMessage(userId, sent.message_id);
  }
}

export function installMenus(bot: Bot): void {
  installServices(bot);
  installPricing(bot);
  installAbout(bot);
  installContacts(bot);
  installNavigation(bot);
}