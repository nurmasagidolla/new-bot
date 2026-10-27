import type { Bot } from 'grammy';
import { dbGet, dbRun, upsertUser, addEvent } from '../db-queries';
import { config } from '../config';
import { getTranslation, getUserLang } from '../i18n';
import type { Lang } from '../types';
import { showMainMenu } from './menus';
import {
  getLastBotMessage,
  getLastUserMessage,
  setLastBotMessage,
  setLastUserMessage,
  clearAllMessages,
} from './message-tracker';

function pickLang(languageCode?: string): Lang {
  return ['ru', 'uk', 'be', 'kk'].includes(languageCode || '') ? 'ru' : 'en';
}

async function cleanupPrevious(ctx: any, userId: number): Promise<void> {
  // Удаляем предыдущее сообщение пользователя (не текущее!)
  const prevUser = getLastUserMessage(userId);
  if (prevUser && prevUser !== ctx.message?.message_id) {
    try {
      await ctx.api.deleteMessage(ctx.chat!.id, prevUser);
    } catch {}
  }

  // Удаляем предыдущее сообщение бота
  const prevBot = getLastBotMessage(userId);
  if (prevBot) {
    try {
      await ctx.api.deleteMessage(ctx.chat!.id, prevBot);
    } catch {}
  }
}

async function sendAndTrack(ctx: any, userId: number, text: string, extra: any): Promise<void> {
  const sent = await ctx.reply(text, extra);
  setLastBotMessage(userId, sent.message_id);
}

async function handleCabinetLink(ctx: any, code: string): Promise<boolean> {
  const userId = ctx.from?.id;
  if (!userId) return false;

  if (!/^[A-Za-z0-9_-]{16,48}$/.test(code)) {
    const lang = await getUserLang(userId);
    await ctx.reply(getTranslation(lang, 'link.invalid'));
    return true;
  }

  const lang = await getUserLang(userId);

  await addEvent('link', {
    code,
    tgUserId: userId,
    username: ctx.from?.username ?? null,
    lang,
  });

  await ctx.reply(getTranslation(lang, 'link.checking'));
  return true;
}

export function installCommands(bot: Bot): void {
  bot.command('start', async (ctx) => {
    const userId = ctx.from?.id;
    if (!userId) return;

    const payload = ctx.match?.trim() ?? '';
    if (payload.startsWith('c_')) {
      const code = payload.slice(2);
      const handled = await handleCabinetLink(ctx, code);
      if (handled) return;
    }

    await cleanupPrevious(ctx, userId);

    // Запоминаем текущее сообщение пользователя (команду) как последнее
    if (ctx.message?.message_id) {
      setLastUserMessage(userId, ctx.message.message_id);
    }

    const existing = await dbGet<{ lang: string }>(
      `SELECT lang FROM users WHERE userId = ?`,
      [userId],
    );

    let lang: Lang;
    if (existing?.lang) {
      lang = existing.lang as Lang;
    } else {
      lang = pickLang(ctx.from?.language_code);
      await upsertUser(userId, lang);
    }

    await showMainMenu(ctx, lang);
  });

  bot.command('menu', async (ctx) => {
    const userId = ctx.from?.id;
    if (!userId) return;

    await cleanupPrevious(ctx, userId);
    if (ctx.message?.message_id) {
      setLastUserMessage(userId, ctx.message.message_id);
    }

    const lang = await getUserLang(userId);
    await showMainMenu(ctx, lang);
  });

  bot.command('lang', async (ctx) => {
    const userId = ctx.from?.id;
    if (!userId) return;

    await cleanupPrevious(ctx, userId);
    if (ctx.message?.message_id) {
      setLastUserMessage(userId, ctx.message.message_id);
    }

    await sendAndTrack(ctx, userId, 'Выберите язык / Choose language:', {
      reply_markup: {
        inline_keyboard: [
          [{ text: '🇷🇺 Русский', callback_data: 'setlang_ru' }],
          [{ text: '🇬🇧 English', callback_data: 'setlang_en' }],
        ],
      },
    });
  });

  bot.callbackQuery(/^setlang_(ru|en)$/, async (ctx) => {
    await ctx.answerCallbackQuery();
    const lang = (ctx.match as RegExpMatchArray)[1] as Lang;
    const userId = ctx.from?.id;
    if (!userId) return;
    await dbRun(`UPDATE users SET lang = ? WHERE userId = ?`, [lang, userId]);
    const msg =
      lang === 'ru'
        ? '✅ Язык изменён на русский. Отправьте /start или /menu.'
        : '✅ Language changed to English. Send /start or /menu.';
    await ctx.editMessageText(msg);
  });

  bot.command('help', async (ctx) => {
    const userId = ctx.from?.id;
    if (!userId) return;

    await cleanupPrevious(ctx, userId);
    if (ctx.message?.message_id) {
      setLastUserMessage(userId, ctx.message.message_id);
    }

    const lang = await getUserLang(userId);
    await sendAndTrack(
      ctx,
      userId,
      `<b>${getTranslation(lang, 'help.title')}</b>\n\n${getTranslation(lang, 'help.text')}`,
      { parse_mode: 'HTML' },
    );
  });

  bot.command('privacy', async (ctx) => {
    const userId = ctx.from?.id;
    if (!userId) return;

    await cleanupPrevious(ctx, userId);
    if (ctx.message?.message_id) {
      setLastUserMessage(userId, ctx.message.message_id);
    }

    const lang = await getUserLang(userId);
    await sendAndTrack(
      ctx,
      userId,
      `<b>${getTranslation(lang, 'privacy.title')}</b>\n\n${getTranslation(lang, 'privacy.text')}`,
      { parse_mode: 'HTML' },
    );
  });

  bot.command('contact', async (ctx) => {
    const userId = ctx.from?.id;
    if (!userId) return;

    await cleanupPrevious(ctx, userId);
    if (ctx.message?.message_id) {
      setLastUserMessage(userId, ctx.message.message_id);
    }

    const lang = await getUserLang(userId);
    await sendAndTrack(
      ctx,
      userId,
      `<b>${getTranslation(lang, 'contact.title')}</b>\n\n${getTranslation(lang, 'contact.text')}`,
      {
        parse_mode: 'HTML',
        reply_markup: {
          inline_keyboard: [
            [
              {
                text: getTranslation(lang, 'contact.button'),
                url: `https://t.me/${config.studioTelegram}`,
              },
            ],
          ],
        },
      },
    );
  });

  bot.command('delete', async (ctx) => {
    const userId = ctx.from?.id;
    if (!userId) return;

    await cleanupPrevious(ctx, userId);
    if (ctx.message?.message_id) {
      setLastUserMessage(userId, ctx.message.message_id);
    }

    const lang = await getUserLang(userId);
    const text =
      lang === 'ru'
        ? 'Удалить всё, что бот знает о вас: язык, подписку и неотправленные заявки? Отменить это нельзя.'
        : 'Delete everything this bot stores about you: language, subscription and unsent briefs? This cannot be undone.';
    const yes = lang === 'ru' ? '🗑 Да, удалить' : '🗑 Yes, delete';
    const no = lang === 'ru' ? '❌ Отмена' : '❌ Cancel';

    await sendAndTrack(ctx, userId, text, {
      reply_markup: {
        inline_keyboard: [
          [{ text: yes, callback_data: 'delete_confirm' }],
          [{ text: no, callback_data: 'delete_cancel' }],
        ],
      },
    });
  });

  bot.callbackQuery('delete_confirm', async (ctx) => {
    const userId = ctx.from?.id;
    if (!userId) return;
    await ctx.answerCallbackQuery();
    const lang = await getUserLang(userId);

    await dbRun(`DELETE FROM brief_state WHERE userId = ?`, [userId]);
    await dbRun(`DELETE FROM users WHERE userId = ?`, [userId]);
    await addEvent('delete', { tgUserId: userId });

    const msg =
      lang === 'ru'
        ? 'Удалено. Чтобы начать заново, нажмите /start.'
        : 'Deleted. Tap /start to begin again.';
    await ctx.editMessageText(msg);
    clearAllMessages(userId);
  });

  bot.callbackQuery('delete_cancel', async (ctx) => {
    await ctx.answerCallbackQuery();
    const userId = ctx.from?.id;
    if (!userId) return;
    const lang = await getUserLang(userId);
    await ctx.editMessageText(lang === 'ru' ? 'Удаление отменено.' : 'Deletion cancelled.');
  });

  bot.command('stats', async (ctx) => {
    const userId = ctx.from?.id;
    if (!userId) return;
    if (!config.adminIds.includes(userId)) {
      await ctx.reply('Команда не найдена.');
      return;
    }

    await cleanupPrevious(ctx, userId);
    if (ctx.message?.message_id) {
      setLastUserMessage(userId, ctx.message.message_id);
    }

    const totalUsers = await dbGet<{ c: number }>(`SELECT COUNT(*) as c FROM users`);
    const newUsers1d = await dbGet<{ c: number }>(`SELECT COUNT(*) as c FROM users WHERE createdAt > datetime('now', '-1 day')`);
    const newUsers7d = await dbGet<{ c: number }>(`SELECT COUNT(*) as c FROM users WHERE createdAt > datetime('now', '-7 day')`);
    const newUsers30d = await dbGet<{ c: number }>(`SELECT COUNT(*) as c FROM users WHERE createdAt > datetime('now', '-30 day')`);

    const totalLeads = await dbGet<{ c: number }>(`SELECT COUNT(*) as c FROM leads`);
    const leads1d = await dbGet<{ c: number }>(`SELECT COUNT(*) as c FROM leads WHERE at > datetime('now', '-1 day')`);
    const leads7d = await dbGet<{ c: number }>(`SELECT COUNT(*) as c FROM leads WHERE at > datetime('now', '-7 day')`);
    const leads30d = await dbGet<{ c: number }>(`SELECT COUNT(*) as c FROM leads WHERE at > datetime('now', '-30 day')`);

    await sendAndTrack(
      ctx,
      userId,
      `<b>Статистика</b>\n\n` +
        `<b>Пользователи:</b>\n` +
        `• Всего: ${totalUsers?.c ?? 0}\n` +
        `• За 1 день: ${newUsers1d?.c ?? 0}\n` +
        `• За 7 дней: ${newUsers7d?.c ?? 0}\n` +
        `• За 30 дней: ${newUsers30d?.c ?? 0}\n\n` +
        `<b>Заявки:</b>\n` +
        `• Всего: ${totalLeads?.c ?? 0}\n` +
        `• За 1 день: ${leads1d?.c ?? 0}\n` +
        `• За 7 дней: ${leads7d?.c ?? 0}\n` +
        `• За 30 дней: ${leads30d?.c ?? 0}`,
      { parse_mode: 'HTML' },
    );
  });

  bot.callbackQuery('menu_subscribe', async (ctx) => {
    await ctx.answerCallbackQuery();
    const userId = ctx.from?.id;
    if (!userId) return;
    const lang = await getUserLang(userId);
    const user = await dbGet<{ subscribed: number }>(
      `SELECT subscribed FROM users WHERE userId = ?`,
      [userId],
    );
    const isSubscribed = user?.subscribed === 1;

    const title = lang === 'ru' ? '<b>Новости студии</b>' : '<b>Studio news</b>';
    const text =
      lang === 'ru'
        ? 'Раз в месяц присылаем, что нового в студии: кейсы, обновления, полезные материалы. Без спама. Отписаться можно в любой момент.'
        : 'Once a month we send what is new in the studio: cases, updates, useful materials. No spam. Unsubscribe at any time.';
    const status = isSubscribed
      ? lang === 'ru'
        ? '\n\n✅ Вы подписаны на новости студии.'
        : '\n\n✅ You are subscribed to studio news.'
      : lang === 'ru'
        ? '\n\n📪 Вы пока не подписаны.'
        : '\n\n📪 You are not subscribed yet.';

    const toggle = isSubscribed
      ? {
          text: lang === 'ru' ? '📪 Отписаться' : '📪 Unsubscribe',
          callback_data: 'sub_unsubscribe',
        }
      : {
          text: lang === 'ru' ? '✅ Подписаться' : '✅ Subscribe',
          callback_data: 'sub_subscribe',
        };

    const back = {
      text: getTranslation(lang, 'buttons.back'),
      callback_data: 'menu_back',
    };

    await ctx.editMessageText(`${title}\n\n${text}${status}`, {
      parse_mode: 'HTML',
      reply_markup: { inline_keyboard: [[toggle], [back]] },
    });
    setLastBotMessage(userId, ctx.callbackQuery!.message!.message_id);
  });

  bot.callbackQuery('sub_subscribe', async (ctx) => {
    await ctx.answerCallbackQuery();
    const userId = ctx.from?.id;
    if (!userId) return;
    await dbRun(`UPDATE users SET subscribed = 1 WHERE userId = ?`, [userId]);
    const lang = await getUserLang(userId);

    const title = lang === 'ru' ? '<b>Новости студии</b>' : '<b>Studio news</b>';
    const text =
      lang === 'ru'
        ? '✅ Вы подписаны на новости студии. Пишем редко, отписаться можно в любой момент.'
        : '✅ You are subscribed to studio news. We write rarely, unsubscribe at any time.';

    await ctx.editMessageText(`${title}\n\n${text}`, {
      parse_mode: 'HTML',
      reply_markup: {
        inline_keyboard: [
          [
            {
              text: lang === 'ru' ? '📪 Отписаться' : '📪 Unsubscribe',
              callback_data: 'sub_unsubscribe',
            },
          ],
          [{ text: getTranslation(lang, 'buttons.back'), callback_data: 'menu_back' }],
        ],
      },
    });
    setLastBotMessage(userId, ctx.callbackQuery!.message!.message_id);
  });

  bot.callbackQuery('sub_unsubscribe', async (ctx) => {
    await ctx.answerCallbackQuery();
    const userId = ctx.from?.id;
    if (!userId) return;
    await dbRun(`UPDATE users SET subscribed = 0 WHERE userId = ?`, [userId]);
    const lang = await getUserLang(userId);

    const title = lang === 'ru' ? '<b>Новости студии</b>' : '<b>Studio news</b>';
    const text =
      lang === 'ru'
        ? '📪 Вы отписаны от новостей.'
        : '📪 You are unsubscribed from news.';

    await ctx.editMessageText(`${title}\n\n${text}`, {
      parse_mode: 'HTML',
      reply_markup: {
        inline_keyboard: [
          [
            {
              text: lang === 'ru' ? '✅ Подписаться' : '✅ Subscribe',
              callback_data: 'sub_subscribe',
            },
          ],
          [{ text: getTranslation(lang, 'buttons.back'), callback_data: 'menu_back' }],
        ],
      },
    });
    setLastBotMessage(userId, ctx.callbackQuery!.message!.message_id);
  });
}