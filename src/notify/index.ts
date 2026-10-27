import type { Bot } from 'grammy';
import { dbGet, dbRun } from '../db-queries';
import { logger } from '../logger';
import { getTranslation } from '../i18n';
import type { Lang } from '../types';

export type NotifyTemplate =
  | 'linked'
  | 'cabinet_update'
  | 'invoice'
  | 'payment_received'
  | 'text';

export interface NotifyParams {
  text?: string;
  title?: string;
  amount?: string;
  url?: string;
  expiresAt?: string;
  customText?: string;
}

export interface NotifyResult {
  ok: boolean;
  messageId?: number;
  error?: 'blocked' | 'not_found' | 'rate_limited';
}

export async function sendNotify(
  bot: Bot,
  key: string,
  tgUserId: number,
  template: NotifyTemplate,
  params: NotifyParams,
): Promise<NotifyResult> {
  // 1. Идемпотентность
  const existing = await dbGet<{ result: string }>(
    `SELECT result FROM notify_log WHERE key = ?`,
    [key],
  );
  if (existing) {
    try {
      return JSON.parse(existing.result) as NotifyResult;
    } catch {
      return { ok: false, error: 'not_found' };
    }
  }

  // 2. Проверка пользователя
  const user = await dbGet<{ lang: string }>(
    `SELECT lang FROM users WHERE userId = ?`,
    [tgUserId],
  );
  if (!user) {
    const result: NotifyResult = { ok: false, error: 'not_found' };
    await saveNotifyResult(key, result);
    return result;
  }

  const lang = (user.lang as Lang) ?? 'en';

  // 3. Отправка
  try {
    const sent = await sendTemplateMessage(bot, tgUserId, lang, template, params);
    const result: NotifyResult = { ok: true, messageId: sent.message_id };
    await saveNotifyResult(key, result);
    return result;
  } catch (e: any) {
    const code = e?.error_code ?? 0;
    let error: NotifyResult['error'];
    if (code === 403) error = 'blocked';
    else if (code === 429) error = 'rate_limited';
    else error = 'not_found';

    logger.warn(`[notify] ${template} -> ${tgUserId}: ${error} (code ${code})`);

    const result: NotifyResult = { ok: false, error };
    await saveNotifyResult(key, result);
    return result;
  }
}

async function sendTemplateMessage(
  bot: Bot,
  tgUserId: number,
  lang: Lang,
  template: NotifyTemplate,
  params: NotifyParams,
): Promise<{ message_id: number }> {
  const tr = (key: string, p?: Record<string, string>) =>
    getTranslation(lang, `notify.${key}`, p);

  if (template === 'linked') {
    return bot.api.sendMessage(tgUserId, tr('linked'));
  }

  if (template === 'cabinet_update') {
    const text = tr('cabinet_update', { text: params.text ?? '' });
    return bot.api.sendMessage(tgUserId, text, {
      reply_markup: {
        inline_keyboard: [
          [{ text: tr('cabinet_update_button'), url: 'https://my.cloutlab.studio/' }],
        ],
      },
    });
  }

  if (template === 'invoice') {
    const expired = params.expiresAt
      ? new Date(params.expiresAt) < new Date()
      : false;

    const text = tr('invoice', {
      title: params.title ?? '',
      amount: params.amount ?? '',
      expiresAt: params.expiresAt ?? '—',
    });

    if (expired) {
      return bot.api.sendMessage(tgUserId, `${text}\n\n${tr('invoice_expired')}`);
    }

    return bot.api.sendMessage(tgUserId, text, {
      reply_markup: {
        inline_keyboard: [
          [{ text: tr('invoice_button'), url: params.url ?? 'https://cloutlab.studio' }],
        ],
      },
    });
  }

  if (template === 'payment_received') {
    return bot.api.sendMessage(
      tgUserId,
      tr('payment_received', { title: params.title ?? '' }),
    );
  }

  if (template === 'text') {
    return bot.api.sendMessage(tgUserId, params.customText ?? '');
  }

  throw new Error(`Unknown template: ${template}`);
}

async function saveNotifyResult(key: string, result: NotifyResult): Promise<void> {
  await dbRun(
    `INSERT OR REPLACE INTO notify_log (key, result, createdAt) VALUES (?, ?, ?)`,
    [key, JSON.stringify(result), new Date().toISOString()],
  );
}