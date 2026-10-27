import type { Bot } from 'grammy';
import { config } from '../config';
import { getTranslation, getUserLang } from '../i18n';
import { dbAll, dbRun } from '../db-queries';
import { logger } from '../logger';
import {
  getBroadcastState,
  setBroadcastState,
  clearBroadcastState,
  getAudienceLabel,
} from './index';
import type { BroadcastButton, BroadcastState } from './index';

const ADMIN_LANG: 'ru' = 'ru'; // админ — всегда ru для команд

function isAdmin(userId: number | undefined): boolean {
  return !!userId && config.adminIds.includes(userId);
}

async function showAudiencePicker(ctx: any): Promise<void> {
  await ctx.reply(getTranslation(ADMIN_LANG, 'broadcast.ask_audience'), {
    reply_markup: {
      inline_keyboard: [
        [{ text: getTranslation(ADMIN_LANG, 'broadcast.audience_ru'), callback_data: 'bcast_aud_ru' }],
        [{ text: getTranslation(ADMIN_LANG, 'broadcast.audience_en'), callback_data: 'bcast_aud_en' }],
        [{ text: getTranslation(ADMIN_LANG, 'broadcast.audience_all'), callback_data: 'bcast_aud_all' }],
        [{ text: getTranslation(ADMIN_LANG, 'broadcast.cancel'), callback_data: 'bcast_cancel' }],
      ],
    },
  });
}

async function showPreview(ctx: any, state: BroadcastState): Promise<void> {
  const audience = state.audience ?? 'all';
  const count = await countRecipients(audience);

  if (count === 0) {
    await ctx.reply(getTranslation(ADMIN_LANG, 'broadcast.no_recipients'));
    clearBroadcastState(ctx.from.id);
    return;
  }

  const buttons = (state.buttons ?? []).map((b) => [{ text: b.text, url: b.url }]);

  const previewText =
    getTranslation(ADMIN_LANG, 'broadcast.preview_title') +
    (state.text ?? '') +
    getTranslation(ADMIN_LANG, 'broadcast.preview_audience', {
      audience: getAudienceLabel(ADMIN_LANG, audience),
      count: String(count),
    });

  await ctx.reply(previewText, {
    parse_mode: 'HTML',
    reply_markup: {
      inline_keyboard: [
        ...buttons,
        [{ text: getTranslation(ADMIN_LANG, 'broadcast.confirm'), callback_data: 'bcast_send' }],
        [{ text: getTranslation(ADMIN_LANG, 'broadcast.cancel'), callback_data: 'bcast_cancel' }],
      ],
    },
  });

  setBroadcastState(ctx.from.id, { ...state, step: 'preview' });
}

async function countRecipients(audience: 'ru' | 'en' | 'all'): Promise<number> {
  const sql =
    audience === 'all'
      ? `SELECT COUNT(*) as c FROM users WHERE subscribed = 1`
      : `SELECT COUNT(*) as c FROM users WHERE subscribed = 1 AND lang = ?`;
  const params = audience === 'all' ? [] : [audience];
  const rows = await dbAll<{ c: number }>(sql, params);
  return rows[0]?.c ?? 0;
}

async function getRecipients(audience: 'ru' | 'en' | 'all'): Promise<number[]> {
  const sql =
    audience === 'all'
      ? `SELECT userId FROM users WHERE subscribed = 1`
      : `SELECT userId FROM users WHERE subscribed = 1 AND lang = ?`;
  const params = audience === 'all' ? [] : [audience];
  const rows = await dbAll<{ userId: number }>(sql, params);
  return rows.map((r) => r.userId);
}

async function doBroadcast(ctx: any, state: BroadcastState): Promise<void> {
  const audience = state.audience ?? 'all';
  const recipients = await getRecipients(audience);

  let sent = 0;
  let errors = 0;
  let unsubscribed = 0;

  const buttons = (state.buttons ?? []).map((b) => [{ text: b.text, url: b.url }]);
  const reply_markup = buttons.length ? { inline_keyboard: buttons } : undefined;

  const total = recipients.length;
  const statusMsg = await ctx.reply(
    getTranslation(ADMIN_LANG, 'broadcast.sending', { current: '0', total: String(total) }),
  );

  for (let i = 0; i < recipients.length; i++) {
    const tgUserId = recipients[i];
    try {
      await ctx.api.sendMessage(tgUserId, state.text ?? '', { reply_markup });
      sent++;
    } catch (e: any) {
      const code = e?.error_code;
      if (code === 403) {
        // заблокировал — снимаем подписку
        await dbRun(`UPDATE users SET subscribed = 0 WHERE userId = ?`, [tgUserId]);
        unsubscribed++;
      } else if (code === 429) {
        // rate limit — ждём retry_after
        const retry = e?.parameters?.retry_after ?? 1;
        logger.warn(`[broadcast] 429, waiting ${retry}s`);
        await new Promise((r) => setTimeout(r, retry * 1000));
        try {
          await ctx.api.sendMessage(tgUserId, state.text ?? '', { reply_markup });
          sent++;
        } catch {
          errors++;
        }
      } else {
        errors++;
      }
    }

    // Прогресс каждые 10 сообщений
    if ((i + 1) % 10 === 0 || i + 1 === total) {
      try {
        await ctx.api.editMessageText(
          ctx.chat!.id,
          statusMsg.message_id,
          getTranslation(ADMIN_LANG, 'broadcast.sending', {
            current: String(i + 1),
            total: String(total),
          }),
        );
      } catch {
        // ignore edit error
      }
    }

    // Лимит Telegram — 25 msg/sec, делаем паузу 50 мс (20/sec)
    await new Promise((r) => setTimeout(r, 50));
  }

  await ctx.api.editMessageText(
    ctx.chat!.id,
    statusMsg.message_id,
    getTranslation(ADMIN_LANG, 'broadcast.done', {
      sent: String(sent),
      errors: String(errors),
      unsubscribed: String(unsubscribed),
    }),
    { parse_mode: 'HTML' },
  );

  clearBroadcastState(ctx.from.id);
}

export function installBroadcast(bot: Bot): void {
  // --- /broadcast ---
  bot.command('broadcast', async (ctx) => {
    const userId = ctx.from?.id;
    if (!isAdmin(userId)) {
      await ctx.reply(getTranslation(ADMIN_LANG, 'broadcast.only_admin'));
      return;
    }
    setBroadcastState(userId!, { step: 'text' });
    await ctx.reply(getTranslation(ADMIN_LANG, 'broadcast.ask_text'));
  });

  // --- /cancel ---
  bot.command('cancel', async (ctx) => {
    const userId = ctx.from?.id;
    if (!isAdmin(userId)) return;
    clearBroadcastState(userId!);
    await ctx.reply(getTranslation(ADMIN_LANG, 'broadcast.cancelled'));
  });

  // --- /skip ---
  bot.command('skip', async (ctx) => {
    const userId = ctx.from?.id;
    if (!isAdmin(userId)) return;
    const state = getBroadcastState(userId!);
    if (!state || state.step !== 'buttons') return;
    state.step = 'audience';
    setBroadcastState(userId!, state);
    await showAudiencePicker(ctx);
  });

  // --- Приём текста и кнопок ---
  bot.on('message:text', async (ctx, next) => {
    const userId = ctx.from?.id;
    if (!isAdmin(userId)) return next();
    const text = ctx.message.text;
    if (text.startsWith('/')) return next();
    const state = getBroadcastState(userId!);
    if (!state) return next();

    if (state.step === 'text') {
      if (text.length > 4000) {
        await ctx.reply(getTranslation(ADMIN_LANG, 'broadcast.too_long'));
        return;
      }
      state.text = text;
      state.step = 'buttons';
      setBroadcastState(userId!, state);
      await ctx.reply(getTranslation(ADMIN_LANG, 'broadcast.ask_buttons'), {
        parse_mode: 'Markdown',
      });
      return;
    }

    if (state.step === 'buttons') {
      // Парсим "Текст | URL"
      const match = text.match(/^(.+?)\s*\|\s*(https?:\/\/\S+)$/);
      if (!match) {
        await ctx.reply(getTranslation(ADMIN_LANG, 'broadcast.invalid_buttons'));
        return;
      }
      const btn: BroadcastButton = { text: match[1].trim(), url: match[2].trim() };
      state.buttons = state.buttons ?? [];
      if (state.buttons.length >= 2) {
        await ctx.reply(getTranslation(ADMIN_LANG, 'broadcast.invalid_buttons'));
        return;
      }
      state.buttons.push(btn);
      setBroadcastState(userId!, state);
      await ctx.reply(
        `Добавлена кнопка: "${btn.text}". Ещё одну (или /skip).`,
        { parse_mode: 'HTML' },
      );
      return;
    }

    return next();
  });

  // --- Кнопки аудитории ---
  bot.callbackQuery(/^bcast_aud_(ru|en|all)$/, async (ctx) => {
    await ctx.answerCallbackQuery();
    const userId = ctx.from?.id;
    if (!isAdmin(userId)) return;
    const state = getBroadcastState(userId!);
    if (!state) return;

    state.audience = (ctx.match as RegExpMatchArray)[1] as 'ru' | 'en' | 'all';
    state.step = 'preview';
    setBroadcastState(userId!, state);
    await showPreview(ctx, state);
  });

  // --- Отправка ---
  bot.callbackQuery('bcast_send', async (ctx) => {
    await ctx.answerCallbackQuery();
    const userId = ctx.from?.id;
    if (!isAdmin(userId)) return;
    const state = getBroadcastState(userId!);
    if (!state || state.step !== 'preview') return;
    await doBroadcast(ctx, state);
  });

  // --- Отмена ---
  bot.callbackQuery('bcast_cancel', async (ctx) => {
    await ctx.answerCallbackQuery();
    const userId = ctx.from?.id;
    if (!isAdmin(userId)) return;
    clearBroadcastState(userId!);
    await ctx.reply(getTranslation(ADMIN_LANG, 'broadcast.cancelled'));
  });
}