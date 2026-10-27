import { getTranslation, getUserLang } from '../i18n';
import type { BriefState } from '../fsm/brief';
import {
  setLastBotMessage,
  getAllBotMessages,
  clearAllBotMessages,
} from '../bot/message-tracker';

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

  if (ctx.callbackQuery) {
    try {
      await ctx.editMessageText(text, { parse_mode: 'HTML', reply_markup });
      setLastBotMessage(userId, ctx.callbackQuery.message.message_id);
      return;
    } catch {}
  }
  const sent = await ctx.reply(text, { parse_mode: 'HTML', reply_markup });
  setLastBotMessage(userId, sent.message_id);
}

export async function showService(ctx: any): Promise<void> {
  const userId = ctx.from?.id;
  if (!userId) return;
  const lang = await getUserLang(userId);

  await ctx.editMessageText(getTranslation(lang, 'brief.service_title'), {
    reply_markup: {
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
    },
  });
  setLastBotMessage(userId, ctx.callbackQuery!.message!.message_id);
}

export async function showIndustry(ctx: any): Promise<void> {
  const userId = ctx.from?.id;
  if (!userId) return;
  const lang = await getUserLang(userId);

  const industries = ['creators', 'ai', 'fintech', 'healthcare', 'ecommerce', 'edtech', 'realestate', 'logistics', 'saas'];

  await ctx.editMessageText(getTranslation(lang, 'brief.industry_title'), {
    reply_markup: {
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
    },
  });
  setLastBotMessage(userId, ctx.callbackQuery!.message!.message_id);
}

export async function showBudget(ctx: any): Promise<void> {
  const userId = ctx.from?.id;
  if (!userId) return;
  const lang = await getUserLang(userId);

  const budgets = ['lt50k', '50k', '100k', '250k', '500k', '1m'];

  await ctx.editMessageText(getTranslation(lang, 'brief.budget_title'), {
    reply_markup: {
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
    },
  });
  setLastBotMessage(userId, ctx.callbackQuery!.message!.message_id);
}

export async function showMessageStep(ctx: any): Promise<void> {
  const userId = ctx.from?.id;
  if (!userId) return;
  const lang = await getUserLang(userId);

  await ctx.editMessageText(getTranslation(lang, 'brief.message_title'), {
    reply_markup: {
      inline_keyboard: [
        [
          { text: getTranslation(lang, 'buttons.back'), callback_data: 'brief_back_budget' },
          { text: getTranslation(lang, 'buttons.cancel'), callback_data: 'brief_cancel' },
        ],
      ],
    },
  });
  setLastBotMessage(userId, ctx.callbackQuery!.message!.message_id);
}

export async function showNameStep(ctx: any): Promise<void> {
  const userId = ctx.from?.id;
  if (!userId) return;
  const lang = await getUserLang(userId);

  const sent = await ctx.reply(getTranslation(lang, 'brief.name_title'), {
    reply_markup: {
      inline_keyboard: [
        [
          { text: getTranslation(lang, 'buttons.back'), callback_data: 'brief_back_message' },
          { text: getTranslation(lang, 'buttons.cancel'), callback_data: 'brief_cancel' },
        ],
      ],
    },
  });
  setLastBotMessage(userId, sent.message_id);
}

export async function showContact(ctx: any): Promise<void> {
  const userId = ctx.from?.id;
  if (!userId) return;
  const lang = await getUserLang(userId);

  const sent = await ctx.reply(getTranslation(lang, 'brief.contact_title'), {
    reply_markup: {
      inline_keyboard: [
        [{ text: getTranslation(lang, 'brief.contact_telegram'), callback_data: 'brief_contact_telegram' }],
        [{ text: getTranslation(lang, 'brief.contact_phone'), callback_data: 'brief_contact_phone' }],
        [{ text: getTranslation(lang, 'brief.contact_email'), callback_data: 'brief_contact_email' }],
        [
          { text: getTranslation(lang, 'buttons.back'), callback_data: 'brief_back_name' },
          { text: getTranslation(lang, 'buttons.cancel'), callback_data: 'brief_cancel' },
        ],
      ],
    },
  });
  setLastBotMessage(userId, sent.message_id);
}

export async function showReview(ctx: any, state: BriefState): Promise<void> {
  const userId = ctx.from?.id;
  if (!userId) return;
  const lang = await getUserLang(userId);

  const all = getAllBotMessages(userId);
  for (const msgId of all) {
    try {
      await ctx.api.deleteMessage(ctx.chat.id, msgId);
    } catch {}
  }
  clearAllBotMessages(userId);

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

  const sent = await ctx.reply(lines.join('\n'), {
    parse_mode: 'HTML',
    reply_markup: {
      inline_keyboard: [
        [{ text: getTranslation(lang, 'brief.send'), callback_data: 'brief_submit' }],
        [{ text: getTranslation(lang, 'brief.edit'), callback_data: 'brief_edit' }],
        [
          { text: getTranslation(lang, 'buttons.back'), callback_data: 'brief_back_contact' },
          { text: getTranslation(lang, 'buttons.cancel'), callback_data: 'brief_cancel' },
        ],
      ],
    },
  });
  setLastBotMessage(userId, sent.message_id);
}