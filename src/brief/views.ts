import { getTranslation, getUserLang } from '../i18n';
import { getCardFileId } from '../cards';
import type { BriefState } from '../fsm/brief';

/**
 * Универсальный хелпер: отправить сообщение с карточкой (если есть file_id) или текстом.
 */
async function sendWithCard(
  ctx: any,
  lang: 'ru' | 'en',
  screenId: string,
  text: string,
  reply_markup: any,
  mode: 'reply' | 'edit' = 'reply',
): Promise<void> {
  const fileId = getCardFileId(lang, screenId);

  if (fileId) {
    // Отправляем/редактируем как фото с подписью
    if (mode === 'edit') {
      // editMessageMedia требует InputMediaPhoto
      try {
        await ctx.editMessageMedia(
          {
            type: 'photo',
            media: fileId,
            caption: text,
            parse_mode: 'HTML',
          },
          { reply_markup },
        );
        return;
      } catch {
        // fallback: если editMessageMedia не сработал (например, сообщение без медиа)
      }
    }
    await ctx.replyWithPhoto(fileId, {
      caption: text,
      parse_mode: 'HTML',
      reply_markup,
    });
    return;
  }

  // Fallback: обычный текст
  if (mode === 'edit') {
    try {
      await ctx.editMessageText(text, { parse_mode: 'HTML', reply_markup });
      return;
    } catch {
      // fallback
    }
  }
  await ctx.reply(text, { parse_mode: 'HTML', reply_markup });
}

// ============================================
// Шаг 1: Согласие
// ============================================
export async function showConsent(ctx: any): Promise<void> {
  const userId = ctx.from?.id;
  if (!userId) return;
  const lang = await getUserLang(userId);

  const text =
    `<b>${getTranslation(lang, 'brief.consent_title')}</b>\n\n` +
    getTranslation(lang, 'brief.consent_text');

  const reply_markup = {
    inline_keyboard: [
      [{ text: getTranslation(lang, 'brief.consent_yes'), callback_data: 'brief_consent_yes' }],
      [
        { text: getTranslation(lang, 'brief.policy'), url: 'https://cloutlab.studio/privacy/' },
        { text: getTranslation(lang, 'brief.consent'), url: 'https://cloutlab.studio/consent/' },
      ],
      [
        { text: getTranslation(lang, 'buttons.back'), callback_data: 'menu_back' },
        { text: getTranslation(lang, 'buttons.cancel'), callback_data: 'brief_cancel' },
      ],
    ],
  };

  await sendWithCard(ctx, lang, 'step-1-consent', text, reply_markup, 'reply');
}

// ============================================
// Шаг 2: Услуга
// ============================================
export async function showService(ctx: any): Promise<void> {
  const userId = ctx.from?.id;
  if (!userId) return;
  const lang = await getUserLang(userId);

  const text = getTranslation(lang, 'brief.service_title');

  const reply_markup = {
    inline_keyboard: [
      [{ text: getTranslation(lang, 'services_list.telegram-bots'), callback_data: 'brief_service_telegram-bots' }],
      [{ text: getTranslation(lang, 'services_list.ai-agents'), callback_data: 'brief_service_ai-agents' }],
      [{ text: getTranslation(lang, 'services_list.automation'), callback_data: 'brief_service_automation' }],
      [{ text: getTranslation(lang, 'services_list.crm'), callback_data: 'brief_service_crm' }],
      [{ text: getTranslation(lang, 'services_list.mobile-apps'), callback_data: 'brief_service_mobile-apps' }],
      [{ text: getTranslation(lang, 'services_list.web-apps'), callback_data: 'brief_service_web-apps' }],
      [
        { text: getTranslation(lang, 'buttons.back'), callback_data: 'brief_back_consent' },
        { text: getTranslation(lang, 'buttons.cancel'), callback_data: 'brief_cancel' },
      ],
    ],
  };

  await sendWithCard(ctx, lang, 'step-2-service', text, reply_markup, 'edit');
}

// ============================================
// Шаг 3: Отрасль
// ============================================
export async function showIndustry(ctx: any): Promise<void> {
  const userId = ctx.from?.id;
  if (!userId) return;
  const lang = await getUserLang(userId);

  const text = getTranslation(lang, 'brief.industry_title');
  const industries = ['creators', 'ai', 'fintech', 'healthcare', 'ecommerce', 'edtech', 'realestate', 'logistics', 'saas'];

  const reply_markup = {
    inline_keyboard: [
      ...industries.map((slug) => [
        { text: getTranslation(lang, `industries.${slug}`), callback_data: `brief_industry_${slug}` },
      ]),
      [{ text: getTranslation(lang, 'brief.skip'), callback_data: 'brief_industry_skip' }],
      [
        { text: getTranslation(lang, 'buttons.back'), callback_data: 'brief_back_service' },
        { text: getTranslation(lang, 'buttons.cancel'), callback_data: 'brief_cancel' },
      ],
    ],
  };

  await sendWithCard(ctx, lang, 'step-3-industry', text, reply_markup, 'edit');
}

// ============================================
// Шаг 4: Бюджет
// ============================================
export async function showBudget(ctx: any): Promise<void> {
  const userId = ctx.from?.id;
  if (!userId) return;
  const lang = await getUserLang(userId);

  const text = getTranslation(lang, 'brief.budget_title');
  const budgets = ['lt50k', '50k', '100k', '250k', '500k', '1m'];

  const reply_markup = {
    inline_keyboard: [
      ...budgets.map((slug) => [
        { text: getTranslation(lang, `budgets.${slug}`), callback_data: `brief_budget_${slug}` },
      ]),
      [{ text: getTranslation(lang, 'budgets.unknown'), callback_data: 'brief_budget_unknown' }],
      [
        { text: getTranslation(lang, 'buttons.back'), callback_data: 'brief_back_industry' },
        { text: getTranslation(lang, 'buttons.cancel'), callback_data: 'brief_cancel' },
      ],
    ],
  };

  await sendWithCard(ctx, lang, 'step-4-budget', text, reply_markup, 'edit');
}

// ============================================
// Шаг 5: Задача
// ============================================
export async function showMessageStep(ctx: any): Promise<void> {
  const userId = ctx.from?.id;
  if (!userId) return;
  const lang = await getUserLang(userId);

  const text = getTranslation(lang, 'brief.message_title');

  const reply_markup = {
    inline_keyboard: [
      [
        { text: getTranslation(lang, 'buttons.back'), callback_data: 'brief_back_budget' },
        { text: getTranslation(lang, 'buttons.cancel'), callback_data: 'brief_cancel' },
      ],
    ],
  };

  await sendWithCard(ctx, lang, 'step-5-message', text, reply_markup, 'edit');
}

// ============================================
// Шаг 6: Имя
// ============================================
export async function showNameStep(ctx: any): Promise<void> {
  const userId = ctx.from?.id;
  if (!userId) return;
  const lang = await getUserLang(userId);

  const text = getTranslation(lang, 'brief.name_title');

  const reply_markup = {
    inline_keyboard: [
      [
        { text: getTranslation(lang, 'buttons.back'), callback_data: 'brief_back_message' },
        { text: getTranslation(lang, 'buttons.cancel'), callback_data: 'brief_cancel' },
      ],
    ],
  };

  await sendWithCard(ctx, lang, 'step-6-name', text, reply_markup, 'reply');
}

// ============================================
// Шаг 7: Контакт
// ============================================
export async function showContact(ctx: any): Promise<void> {
  const userId = ctx.from?.id;
  if (!userId) return;
  const lang = await getUserLang(userId);

  const text = getTranslation(lang, 'brief.contact_title');

  const reply_markup = {
    inline_keyboard: [
      [{ text: getTranslation(lang, 'brief.contact_telegram'), callback_data: 'brief_contact_telegram' }],
      [{ text: getTranslation(lang, 'brief.contact_phone'), callback_data: 'brief_contact_phone' }],
      [{ text: getTranslation(lang, 'brief.contact_email'), callback_data: 'brief_contact_email' }],
      [
        { text: getTranslation(lang, 'buttons.back'), callback_data: 'brief_back_name' },
        { text: getTranslation(lang, 'buttons.cancel'), callback_data: 'brief_cancel' },
      ],
    ],
  };

  await sendWithCard(ctx, lang, 'step-7-contact', text, reply_markup, 'reply');
}

// ============================================
// Шаг 8: Проверка
// ============================================
export async function showReview(ctx: any, state: BriefState): Promise<void> {
  const userId = ctx.from?.id;
  if (!userId) return;
  const lang = await getUserLang(userId);

  const lines = [
    `<b>${getTranslation(lang, 'brief.review_title')}</b>`,
    '',
    `<b>Service:</b> ${state.service ?? '—'}`,
    `<b>Industry:</b> ${state.industry ?? '—'}`,
    `<b>Budget:</b> ${state.budget ?? '—'}`,
    `<b>Message:</b> ${state.message ?? '—'}`,
    `<b>Name:</b> ${state.name ?? '—'}`,
    `<b>Contact:</b> ${state.contact ? `${state.contact.type}: ${state.contact.value}` : '—'}`,
  ];

  const text = lines.join('\n');

  const reply_markup = {
    inline_keyboard: [
      [{ text: getTranslation(lang, 'brief.send'), callback_data: 'brief_submit' }],
      [{ text: getTranslation(lang, 'brief.edit'), callback_data: 'brief_edit' }],
      [
        { text: getTranslation(lang, 'buttons.back'), callback_data: 'brief_back_contact' },
        { text: getTranslation(lang, 'buttons.cancel'), callback_data: 'brief_cancel' },
      ],
    ],
  };

  await sendWithCard(ctx, lang, 'step-8-review', text, reply_markup, 'reply');
}