import type { Bot } from 'grammy';
import { dbGet, dbRun, upsertUser } from '../db-queries';
import { config } from '../config';
import { getTranslation, getUserLang } from '../i18n';
import type { Lang } from '../types';
import { showMainMenu } from './menus';

function pickLang(languageCode?: string): Lang {
  return ['ru', 'uk', 'be', 'kk'].includes(languageCode || '') ? 'ru' : 'en';
}

export function installCommands(bot: Bot): void {
  bot.command('start', async (ctx) => {
    const userId = ctx.from?.id;
    if (!userId) return;
    const lang = pickLang(ctx.from?.language_code);
    await upsertUser(userId, lang);
    await showMainMenu(ctx, lang);
  });

  bot.command('menu', async (ctx) => {
    const userId = ctx.from?.id;
    if (!userId) return;
    const lang = await getUserLang(userId);
    await showMainMenu(ctx, lang);
  });

  bot.command('lang', async (ctx) => {
    await ctx.reply('Выберите язык / Choose language:', {
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

  // --- /help ---
  bot.command('help', async (ctx) => {
    const userId = ctx.from?.id;
    if (!userId) return;
    const lang = await getUserLang(userId);
    await ctx.reply(
      `<b>${getTranslation(lang, 'help.title')}</b>\n\n${getTranslation(lang, 'help.text')}`,
      { parse_mode: 'HTML' },
    );
  });

  // --- /privacy ---
  bot.command('privacy', async (ctx) => {
    const userId = ctx.from?.id;
    if (!userId) return;
    const lang = await getUserLang(userId);
    await ctx.reply(
      `<b>${getTranslation(lang, 'privacy.title')}</b>\n\n${getTranslation(lang, 'privacy.text')}`,
      { parse_mode: 'HTML' },
    );
  });

  // --- /contact ---
  bot.command('contact', async (ctx) => {
    const userId = ctx.from?.id;
    if (!userId) return;
    const lang = await getUserLang(userId);
    await ctx.reply(
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

  // --- /delete ---
  bot.command('delete', async (ctx) => {
    const userId = ctx.from?.id;
    if (!userId) return;
    const lang = await getUserLang(userId);
    const text =
      lang === 'ru'
        ? 'Удалить всё, что бот знает о вас: язык, подписку и неотправленные заявки? Отменить это нельзя.'
        : 'Delete everything this bot stores about you: language, subscription and unsent briefs? This cannot be undone.';
    const yes = lang === 'ru' ? '🗑 Да, удалить' : '🗑 Yes, delete';
    const no = lang === 'ru' ? '❌ Отмена' : '❌ Cancel';

    await ctx.reply(text, {
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
    const msg =
      lang === 'ru'
        ? 'Удалено. Чтобы начать заново, нажмите /start.'
        : 'Deleted. Tap /start to begin again.';
    await ctx.editMessageText(msg);
  });

  bot.callbackQuery('delete_cancel', async (ctx) => {
    await ctx.answerCallbackQuery();
    const userId = ctx.from?.id;
    if (!userId) return;
    const lang = await getUserLang(userId);
    await ctx.editMessageText(lang === 'ru' ? 'Удаление отменено.' : 'Deletion cancelled.');
  });

  // --- /stats ---
  bot.command('stats', async (ctx) => {
    const userId = ctx.from?.id;
    if (!userId) return;
    if (!config.adminIds.includes(userId)) {
      await ctx.reply('Команда не найдена.');
      return;
    }

    const totalUsers = await dbGet<{ c: number }>(`SELECT COUNT(*) as c FROM users`);
    const newUsers1d = await dbGet<{ c: number }>(`SELECT COUNT(*) as c FROM users WHERE createdAt > datetime('now', '-1 day')`);
    const newUsers7d = await dbGet<{ c: number }>(`SELECT COUNT(*) as c FROM users WHERE createdAt > datetime('now', '-7 day')`);
    const newUsers30d = await dbGet<{ c: number }>(`SELECT COUNT(*) as c FROM users WHERE createdAt > datetime('now', '-30 day')`);

    const totalLeads = await dbGet<{ c: number }>(`SELECT COUNT(*) as c FROM leads`);
    const leads1d = await dbGet<{ c: number }>(`SELECT COUNT(*) as c FROM leads WHERE at > datetime('now', '-1 day')`);
    const leads7d = await dbGet<{ c: number }>(`SELECT COUNT(*) as c FROM leads WHERE at > datetime('now', '-7 day')`);
    const leads30d = await dbGet<{ c: number }>(`SELECT COUNT(*) as c FROM leads WHERE at > datetime('now', '-30 day')`);

    await ctx.reply(
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
}