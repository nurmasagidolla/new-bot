import type { Bot } from 'grammy';
import { randomUUID } from 'crypto';
import { config } from '../config';
import { dbGet, dbRun } from '../db-queries';
import { getBrief, saveBrief } from '../fsm/brief';
import type { BriefState } from '../fsm/brief';
import { encryptLead } from '../encryption';
import { getTranslation, getUserLang } from '../i18n';
import {
  showConsent,
  showService,
  showIndustry,
  showBudget,
  showMessageStep,
  showNameStep,
  showContact,
  showReview,
} from './views';

export function installBrief(bot: Bot): void {
  // ---------- Старт ----------
  bot.callbackQuery('brief_start', async (ctx) => {
    await ctx.answerCallbackQuery();
    const userId = ctx.from?.id;
    if (!userId) return;
    await saveBrief(userId, { step: 'consent' });
    await showConsent(ctx);
  });

  bot.callbackQuery(/^brief_start_(.+)$/, async (ctx) => {
    await ctx.answerCallbackQuery();
    const userId = ctx.from?.id;
    if (!userId) return;
    const service = (ctx.match as RegExpMatchArray)[1];
    await saveBrief(userId, { step: 'consent', service: service as BriefState['service'] });
    await showConsent(ctx);
  });

  bot.command('brief', async (ctx) => {
    const userId = ctx.from?.id;
    if (!userId) return;
    const existing = await getBrief(userId);
    if (!existing || existing.step === 'done' || existing.step === 'consent') {
      await saveBrief(userId, { step: 'consent' });
      await showConsent(ctx);
      return;
    }
    await ctx.reply(`Продолжаем заявку. Текущий шаг: ${existing.step}`);
  });

  // ---------- Шаг 1: Согласие ----------
  bot.callbackQuery('brief_consent_yes', async (ctx) => {
    const userId = ctx.from?.id;
    if (!userId) return;
    await ctx.answerCallbackQuery();
    const state = await getBrief(userId);
    if (!state) return;
    state.consentAt = new Date().toISOString();
    state.consentVersion = '1';
    if (state.service) {
      state.step = 'industry';
      await saveBrief(userId, state);
      await showIndustry(ctx);
      return;
    }
    state.step = 'service';
    await saveBrief(userId, state);
    await showService(ctx);
  });

  // ---------- Шаг 2: Услуга ----------
  bot.callbackQuery(/^brief_service_(.+)$/, async (ctx) => {
    const userId = ctx.from?.id;
    if (!userId) return;
    await ctx.answerCallbackQuery();
    const service = (ctx.match as RegExpMatchArray)[1];
    const state = await getBrief(userId);
    if (!state) return;
    state.service = service as BriefState['service'];
    if (state.editing) {
      state.step = 'review';
      state.editing = false;
      await saveBrief(userId, state);
      await showReview(ctx, state);
      return;
    }
    state.step = 'industry';
    await saveBrief(userId, state);
    await showIndustry(ctx);
  });

  // ---------- Шаг 3: Отрасль ----------
  bot.callbackQuery(/^brief_industry_(.+)$/, async (ctx) => {
    const userId = ctx.from?.id;
    if (!userId) return;
    await ctx.answerCallbackQuery();
    const industry = (ctx.match as RegExpMatchArray)[1];
    const state = await getBrief(userId);
    if (!state) return;
    if (industry !== 'skip') state.industry = industry as BriefState['industry'];
    if (state.editing) {
      state.step = 'review';
      state.editing = false;
      await saveBrief(userId, state);
      await showReview(ctx, state);
      return;
    }
    state.step = 'budget';
    await saveBrief(userId, state);
    await showBudget(ctx);
  });

  // ---------- Шаг 4: Бюджет ----------
  bot.callbackQuery(/^brief_budget_(.+)$/, async (ctx) => {
    const userId = ctx.from?.id;
    if (!userId) return;
    await ctx.answerCallbackQuery();
    const budget = (ctx.match as RegExpMatchArray)[1];
    const state = await getBrief(userId);
    if (!state) return;
    state.budget = budget as BriefState['budget'];
    if (state.editing) {
      state.step = 'review';
      state.editing = false;
      await saveBrief(userId, state);
      await showReview(ctx, state);
      return;
    }
    state.step = 'message';
    await saveBrief(userId, state);
    await showMessageStep(ctx);
  });

  // ---------- Шаги 5–7: текст ----------
  bot.on('message:text', async (ctx, next) => {
    const userId = ctx.from?.id;
    if (!userId) return next();
    const text = ctx.message.text;
    if (text.startsWith('/')) return next();
    const state = await getBrief(userId);
    if (!state) return next();
    const lang = await getUserLang(userId);

    // Задача
    if (state.step === 'message') {
      if (text.length < 10 || text.length > 2000) {
        const msg =
          lang === 'ru'
            ? 'Задача должна быть от 10 до 2000 символов. Попробуйте ещё раз.'
            : 'The task must be 10–2000 characters. Try again.';
        await ctx.reply(msg);
        return;
      }
      state.message = text;
      if (state.editing) {
        state.step = 'review';
        state.editing = false;
        await saveBrief(userId, state);
        await showReview(ctx, state);
        return;
      }
      state.step = 'name';
      await saveBrief(userId, state);
      await showNameStep(ctx);
      return;
    }

    // Имя
    if (state.step === 'name') {
      if (text.length < 1 || text.length > 80) {
        const msg =
          lang === 'ru'
            ? 'Имя должно быть от 1 до 80 символов. Попробуйте ещё раз.'
            : 'The name must be 1–80 characters. Try again.';
        await ctx.reply(msg);
        return;
      }
      state.name = text;
      if (state.editing) {
        state.step = 'review';
        state.editing = false;
        await saveBrief(userId, state);
        await showReview(ctx, state);
        return;
      }
      state.step = 'contact';
      await saveBrief(userId, state);
      await showContact(ctx);
      return;
    }

    // Email
    if (state.step === 'contact' && !state.contact) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(text)) {
        const msg =
          lang === 'ru'
            ? 'Похоже, это не email. Попробуйте ещё раз, например: name@example.com'
            : 'That does not look like an email. Try again, e.g. name@example.com';
        await ctx.reply(msg);
        return;
      }
      state.contact = { type: 'email', value: text };
      state.step = 'review';
      state.editing = false;
      await saveBrief(userId, state);
      await showReview(ctx, state);
      return;
    }

    return next();
  });

  // ---------- Шаг 7: контакт ----------
  bot.callbackQuery('brief_contact_telegram', async (ctx) => {
    const userId = ctx.from?.id;
    if (!userId) return;
    await ctx.answerCallbackQuery();
    const username = ctx.from?.username;
    const lang = await getUserLang(userId);

    if (!username) {
      const text =
        lang === 'ru'
          ? 'У вас не установлен username в Telegram. Выберите другой способ связи:'
          : 'You have no Telegram username. Choose another way to reach you:';
      await ctx.editMessageText(text, {
        reply_markup: {
          inline_keyboard: [
            [{ text: getTranslation(lang, 'brief.contact_phone'), callback_data: 'brief_contact_phone' }],
            [{ text: getTranslation(lang, 'brief.contact_email'), callback_data: 'brief_contact_email' }],
            [
              { text: getTranslation(lang, 'buttons.back'), callback_data: 'brief_back_name' },
              { text: getTranslation(lang, 'buttons.cancel'), callback_data: 'brief_cancel' },
            ],
          ],
        },
      });
      return;
    }
    const state = await getBrief(userId);
    if (!state) return;
    state.contact = { type: 'telegram', value: `@${username}` };
    state.step = 'review';
    state.editing = false;
    await saveBrief(userId, state);
    await showReview(ctx, state);
  });

  bot.callbackQuery('brief_contact_phone', async (ctx) => {
    const userId = ctx.from?.id;
    if (!userId) return;
    await ctx.answerCallbackQuery();
    const lang = await getUserLang(userId);
    const text =
      lang === 'ru'
        ? 'Нажмите кнопку ниже, чтобы отправить свой номер телефона. Принимается только ваш собственный контакт.'
        : 'Tap the button below to share your phone number. Only your own contact is accepted.';
    await ctx.editMessageText(text, {
      reply_markup: {
        inline_keyboard: [
          [{ text: getTranslation(lang, 'brief.contact_phone'), callback_data: 'brief_contact_phone_request' }],
          [
            { text: getTranslation(lang, 'buttons.back'), callback_data: 'brief_back_name' },
            { text: getTranslation(lang, 'buttons.cancel'), callback_data: 'brief_cancel' },
          ],
        ],
      },
    });
  });

  bot.callbackQuery('brief_contact_phone_request', async (ctx) => {
    const userId = ctx.from?.id;
    if (!userId) return;
    await ctx.answerCallbackQuery();
    const lang = await getUserLang(userId);
    const text =
      lang === 'ru' ? 'Нажмите кнопку, чтобы отправить номер:' : 'Tap the button to share your number:';
    const btn = lang === 'ru' ? '📱 Отправить мой номер' : '📱 Send my phone';
    await ctx.reply(text, {
      reply_markup: {
        keyboard: [[{ text: btn, request_contact: true }]],
        resize_keyboard: true,
        one_time_keyboard: true,
      },
    });
  });

  bot.on('message:contact', async (ctx, next) => {
    const userId = ctx.from?.id;
    if (!userId) return next();
    const state = await getBrief(userId);
    if (!state || state.step !== 'contact') return next();
    const lang = await getUserLang(userId);

    if (ctx.message.contact.user_id !== userId) {
      const msg =
        lang === 'ru' ? 'Нужен именно ваш контакт. Попробуйте ещё раз.' : 'We need your own contact. Try again.';
      await ctx.reply(msg);
      return;
    }
    state.contact = { type: 'phone', value: ctx.message.contact.phone_number };
    state.step = 'review';
    state.editing = false;
    await saveBrief(userId, state);
    const saved = lang === 'ru' ? 'Номер сохранён.' : 'Phone saved.';
    await ctx.reply(saved, { reply_markup: { remove_keyboard: true } });
    await showReview(ctx, state);
  });

  bot.callbackQuery('brief_contact_email', async (ctx) => {
    const userId = ctx.from?.id;
    if (!userId) return;
    await ctx.answerCallbackQuery();
    const lang = await getUserLang(userId);
    const text =
      lang === 'ru'
        ? 'Напишите ваш email в чат (например, name@example.com).'
        : 'Type your email in chat (e.g. name@example.com).';
    await ctx.editMessageText(text, {
      reply_markup: {
        inline_keyboard: [
          [
            { text: getTranslation(lang, 'buttons.back'), callback_data: 'brief_back_name' },
            { text: getTranslation(lang, 'buttons.cancel'), callback_data: 'brief_cancel' },
          ],
        ],
      },
    });
  });

  // ---------- Шаг 8: проверка / исправление ----------
  bot.callbackQuery('brief_edit', async (ctx) => {
    await ctx.answerCallbackQuery();
    const userId = ctx.from?.id;
    if (!userId) return;
    const lang = await getUserLang(userId);

    await ctx.editMessageText(getTranslation(lang, 'brief.edit_title'), {
      reply_markup: {
        inline_keyboard: [
          [{ text: getTranslation(lang, 'brief.edit_service'), callback_data: 'brief_edit_service' }],
          [{ text: getTranslation(lang, 'brief.edit_industry'), callback_data: 'brief_edit_industry' }],
          [{ text: getTranslation(lang, 'brief.edit_budget'), callback_data: 'brief_edit_budget' }],
          [{ text: getTranslation(lang, 'brief.edit_message'), callback_data: 'brief_edit_message' }],
          [{ text: getTranslation(lang, 'brief.edit_name'), callback_data: 'brief_edit_name' }],
          [{ text: getTranslation(lang, 'brief.edit_contact'), callback_data: 'brief_edit_contact' }],
          [
            { text: getTranslation(lang, 'buttons.back'), callback_data: 'brief_back_review' },
            { text: getTranslation(lang, 'buttons.cancel'), callback_data: 'brief_cancel' },
          ],
        ],
      },
    });
  });

  bot.callbackQuery('brief_edit_service', async (ctx) => {
    await ctx.answerCallbackQuery();
    const userId = ctx.from?.id;
    if (!userId) return;
    const state = await getBrief(userId);
    if (!state) return;
    state.step = 'service';
    state.editing = true;
    await saveBrief(userId, state);
    await showService(ctx);
  });

  bot.callbackQuery('brief_edit_industry', async (ctx) => {
    await ctx.answerCallbackQuery();
    const userId = ctx.from?.id;
    if (!userId) return;
    const state = await getBrief(userId);
    if (!state) return;
    state.step = 'industry';
    state.editing = true;
    await saveBrief(userId, state);
    await showIndustry(ctx);
  });

  bot.callbackQuery('brief_edit_budget', async (ctx) => {
    await ctx.answerCallbackQuery();
    const userId = ctx.from?.id;
    if (!userId) return;
    const state = await getBrief(userId);
    if (!state) return;
    state.step = 'budget';
    state.editing = true;
    await saveBrief(userId, state);
    await showBudget(ctx);
  });

  bot.callbackQuery('brief_edit_message', async (ctx) => {
    await ctx.answerCallbackQuery();
    const userId = ctx.from?.id;
    if (!userId) return;
    const state = await getBrief(userId);
    if (!state) return;
    state.step = 'message';
    state.message = undefined;
    state.editing = true;
    await saveBrief(userId, state);
    await showMessageStep(ctx);
  });

  bot.callbackQuery('brief_edit_name', async (ctx) => {
    await ctx.answerCallbackQuery();
    const userId = ctx.from?.id;
    if (!userId) return;
    const state = await getBrief(userId);
    if (!state) return;
    state.step = 'name';
    state.name = undefined;
    state.editing = true;
    await saveBrief(userId, state);
    await showNameStep(ctx);
  });

  bot.callbackQuery('brief_edit_contact', async (ctx) => {
    await ctx.answerCallbackQuery();
    const userId = ctx.from?.id;
    if (!userId) return;
    const state = await getBrief(userId);
    if (!state) return;
    state.step = 'contact';
    state.contact = undefined;
    state.editing = true;
    await saveBrief(userId, state);
    await showContact(ctx);
  });

  bot.callbackQuery('brief_back_review', async (ctx) => {
    await ctx.answerCallbackQuery();
    const userId = ctx.from?.id;
    if (!userId) return;
    const state = await getBrief(userId);
    if (!state) return;
    state.editing = false;
    await saveBrief(userId, state);
    await showReview(ctx, state);
  });

  // ---------- Шаг 9: отправка ----------
  bot.callbackQuery('brief_submit', async (ctx) => {
    const userId = ctx.from?.id;
    if (!userId) return;
    await ctx.answerCallbackQuery();
    const lang = await getUserLang(userId);

    // Лимит 3 заявки за сутки
    const todayLeads = await dbGet<{ c: number }>(
      `SELECT COUNT(*) as c FROM leads WHERE at > datetime('now', '-1 day')`,
    );
    if ((todayLeads?.c ?? 0) >= 3) {
      await ctx.editMessageText(getTranslation(lang, 'brief.limit'), {
        reply_markup: {
          inline_keyboard: [
            [{ text: getTranslation(lang, 'buttons.write'), url: `https://t.me/${config.studioTelegram}` }],
          ],
        },
      });
      return;
    }

    const state = await getBrief(userId);
    if (!state) return;
    if (!state.service || !state.message || !state.name || !state.contact) {
      const err =
        lang === 'ru'
          ? 'Не хватает данных. Начните заново: /brief'
          : 'Missing data. Start over: /brief';
      await ctx.editMessageText(err);
      return;
    }

    const leadId = randomUUID();
    const createdAt = new Date().toISOString();

    const payload = {
      id: leadId,
      at: createdAt,
      lang,
      tg: {
        id: userId,
        username: ctx.from?.username ?? null,
        firstName: ctx.from?.first_name ?? null,
      },
      service: state.service,
      package: null,
      industry: state.industry ?? null,
      budget: state.budget ?? null,
      message: state.message,
      name: state.name,
      contact: state.contact,
      source: state.source ?? null,
      consent: {
        at: state.consentAt ?? createdAt,
        version: state.consentVersion ?? '1',
      },
    };

    let encryptedBase64: string;
    try {
      encryptedBase64 = await encryptLead(payload, config.leadsAgeRecipient);
    } catch (e) {
      console.error('[FATAL] encryptLead failed:', e);
      const err =
        lang === 'ru'
          ? 'Не удалось сохранить заявку: на сервере не настроен ключ шифрования. Напишите нам напрямую в Telegram.'
          : 'Could not save the brief: encryption key is not configured. Please message us on Telegram.';
      await ctx.editMessageText(err, {
        reply_markup: {
          inline_keyboard: [
            [{ text: getTranslation(lang, 'buttons.write'), url: `https://t.me/${config.studioTelegram}` }],
          ],
        },
      });
      return;
    }

    await dbRun(`INSERT INTO leads (at, encryptedData) VALUES (?, ?)`, [createdAt, encryptedBase64]);

    await saveBrief(userId, { step: 'done' });

    await ctx.editMessageText(getTranslation(lang, 'brief.submit_success'), {
      reply_markup: {
        inline_keyboard: [
          [{ text: getTranslation(lang, 'buttons.write'), url: `https://t.me/${config.studioTelegram}` }],
        ],
      },
    });
  });

  // ---------- Отмена ----------
  bot.callbackQuery('brief_cancel', async (ctx) => {
    const userId = ctx.from?.id;
    if (!userId) return;
    await ctx.answerCallbackQuery();
    const lang = await getUserLang(userId);
    await ctx.editMessageText(getTranslation(lang, 'brief.cancel_confirm'));
    await saveBrief(userId, { step: 'done' });
  });

  // ---------- «← Назад» в FSM ----------
  bot.callbackQuery('brief_back_consent', async (ctx) => {
    await ctx.answerCallbackQuery();
    const userId = ctx.from?.id;
    if (!userId) return;
    const state = await getBrief(userId);
    if (!state) return;
    state.step = 'consent';
    await saveBrief(userId, state);
    await showConsent(ctx);
  });

  bot.callbackQuery('brief_back_service', async (ctx) => {
    await ctx.answerCallbackQuery();
    const userId = ctx.from?.id;
    if (!userId) return;
    const state = await getBrief(userId);
    if (!state) return;
    state.step = 'service';
    await saveBrief(userId, state);
    await showService(ctx);
  });

  bot.callbackQuery('brief_back_industry', async (ctx) => {
    await ctx.answerCallbackQuery();
    const userId = ctx.from?.id;
    if (!userId) return;
    const state = await getBrief(userId);
    if (!state) return;
    state.step = 'industry';
    await saveBrief(userId, state);
    await showIndustry(ctx);
  });

  bot.callbackQuery('brief_back_budget', async (ctx) => {
    await ctx.answerCallbackQuery();
    const userId = ctx.from?.id;
    if (!userId) return;
    const state = await getBrief(userId);
    if (!state) return;
    state.step = 'budget';
    await saveBrief(userId, state);
    await showBudget(ctx);
  });

  bot.callbackQuery('brief_back_message', async (ctx) => {
    await ctx.answerCallbackQuery();
    const userId = ctx.from?.id;
    if (!userId) return;
    const state = await getBrief(userId);
    if (!state) return;
    state.step = 'message';
    state.message = undefined;
    await saveBrief(userId, state);
    await showMessageStep(ctx);
  });

  bot.callbackQuery('brief_back_name', async (ctx) => {
    await ctx.answerCallbackQuery();
    const userId = ctx.from?.id;
    if (!userId) return;
    const state = await getBrief(userId);
    if (!state) return;
    state.step = 'name';
    state.name = undefined;
    await saveBrief(userId, state);
    await showNameStep(ctx);
  });

  bot.callbackQuery('brief_back_contact', async (ctx) => {
    await ctx.answerCallbackQuery();
    const userId = ctx.from?.id;
    if (!userId) return;
    const state = await getBrief(userId);
    if (!state) return;
    state.step = 'contact';
    state.contact = undefined;
    await saveBrief(userId, state);
    await showContact(ctx);
  });
}