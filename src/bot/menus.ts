import type { Bot } from 'grammy';
import { config } from '../config';
import { getTranslation, getUserLang } from '../i18n';
import type { Lang } from '../types';

const SERVICE_SLUGS = ['telegram-bots', 'ai-agents', 'automation', 'crm', 'mobile-apps', 'web-apps'];

const SERVICE_INFO: Record<string, { what: string; stages: string }> = {
  'telegram-bots': {
    what: '• Боты для продаж и поддержки\n• Mini Apps с оплатой внутри\n• Интеграции с CRM и платежами',
    stages: '1–2 недели — прототип\n3–6 недель — MVP\n2–3 недели — тесты и запуск',
  },
  'ai-agents': {
    what: '• Ассистенты для поддержки клиентов\n• Агенты для обработки заявок\n• RAG на ваших документах',
    stages: '2–3 недели — прототип\n4–8 недель — MVP\n2 недели — тесты',
  },
  'automation': {
    what: '• Автоматизация рутины\n• Интеграции сервисов\n• Скрипты и вебхуки',
    stages: '1–2 недели — аудит\n2–4 недели — внедрение\n1 неделя — тесты',
  },
  'crm': {
    what: '• Настройка и внедрение\n• Кастомные воронки\n• Миграция данных',
    stages: '1–2 недели — аудит\n4–8 недель — внедрение\n2 недели — обучение',
  },
  'mobile-apps': {
    what: '• iOS и Android\n• React Native / Flutter\n• Публикация в сторах',
    stages: '2–3 недели — дизайн\n6–10 недель — разработка\n2 недели — публикация',
  },
  'web-apps': {
    what: '• SPA и SSR\n• Личные кабинеты и дашборды\n• API и интеграции',
    stages: '2 недели — дизайн\n4–8 недель — разработка\n1–2 недели — тесты',
  },
};

export async function showMainMenu(ctx: any, lang: Lang): Promise<void> {
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
  ];

  await ctx.reply(text, {
    parse_mode: 'HTML',
    reply_markup: { inline_keyboard: keyboard },
  });
}

export function installMenus(bot: Bot): void {
  bot.callbackQuery('menu_services', async (ctx) => {
    await ctx.answerCallbackQuery();
    const userId = ctx.from?.id;
    if (!userId) return;
    const lang = await getUserLang(userId);

    const serviceButtons = SERVICE_SLUGS.map((slug) => [
      { text: getTranslation(lang, `services_list.${slug}`), callback_data: `svc_${slug}` },
    ]);

    await ctx.editMessageText(
      `<b>${getTranslation(lang, 'services.title')}</b>\n\n${getTranslation(lang, 'services.subtitle')}`,
      {
        parse_mode: 'HTML',
        reply_markup: {
          inline_keyboard: [
            ...serviceButtons,
            [
              { text: getTranslation(lang, 'buttons.back'), callback_data: 'menu_back' },
              { text: getTranslation(lang, 'buttons.menu'), callback_data: 'menu_home' },
            ],
          ],
        },
      },
    );
  });

  bot.callbackQuery(/^svc_(.+)$/, async (ctx) => {
    await ctx.answerCallbackQuery();
    const slug = (ctx.match as RegExpMatchArray)[1];
    const userId = ctx.from?.id;
    if (!userId) return;
    const lang = await getUserLang(userId);
    const info = SERVICE_INFO[slug] ?? { what: '—', stages: '—' };
    const title = getTranslation(lang, `services_list.${slug}`);

    await ctx.editMessageText(
      `<b>${title}</b>\n\n<b>Что делаем:</b>\n${info.what}\n\n<b>Этапы и сроки:</b>\n${info.stages}`,
      {
        parse_mode: 'HTML',
        reply_markup: {
          inline_keyboard: [
            [{ text: getTranslation(lang, 'menu.pricing') || '📦 Пакеты и цены', callback_data: 'menu_pricing' }],
            [{ text: getTranslation(lang, 'menu.brief'), callback_data: `brief_start_${slug}` }],
            [
              { text: getTranslation(lang, 'buttons.back'), callback_data: 'menu_services' },
              { text: getTranslation(lang, 'buttons.menu'), callback_data: 'menu_home' },
            ],
          ],
        },
      },
    );
  });

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
  });

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
  });

  bot.callbackQuery('menu_pricing', async (ctx) => {
    await ctx.answerCallbackQuery();
    const userId = ctx.from?.id;
    if (!userId) return;
    const lang = await getUserLang(userId);

    await ctx.editMessageText(
      `<b>${getTranslation(lang, 'pricing.title')}</b>\n\n${getTranslation(lang, 'pricing.text')}`,
      {
        parse_mode: 'HTML',
        reply_markup: {
          inline_keyboard: [
            [
              { text: getTranslation(lang, 'buttons.back'), callback_data: 'menu_services' },
              { text: getTranslation(lang, 'buttons.menu'), callback_data: 'menu_home' },
            ],
          ],
        },
      },
    );
  });

  bot.callbackQuery('menu_back', async (ctx) => {
    await ctx.answerCallbackQuery();
    const userId = ctx.from?.id;
    if (!userId) return;
    const lang = await getUserLang(userId);
    await showMainMenu(ctx, lang);
  });

  bot.callbackQuery('menu_home', async (ctx) => {
    await ctx.answerCallbackQuery();
    const userId = ctx.from?.id;
    if (!userId) return;
    const lang = await getUserLang(userId);
    await showMainMenu(ctx, lang);
  });
}