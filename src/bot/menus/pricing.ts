import type { Bot } from 'grammy';
import { getTranslation, getUserLang } from '../../i18n';
import { PRICING } from '../menus-data';
import type { PricingPackage } from '../menus-data';
import { setLastBotMessage } from '../message-tracker';

function formatPackages(pkgs: PricingPackage[], lang: 'ru' | 'en'): string {
  return pkgs
    .map(
      (p, i) =>
        `<b>${i + 1}. ${p.name[lang]}</b>\n<i>${p.duration[lang]}</i> — <b>${p.price[lang]}</b>\n${p.features[lang]}`,
    )
    .join('\n\n');
}

export function installPricing(bot: Bot): void {
  bot.callbackQuery(/^menu_pricing_(.+)$/, async (ctx) => {
    await ctx.answerCallbackQuery();
    const slug = (ctx.match as RegExpMatchArray)[1];
    const userId = ctx.from?.id;
    if (!userId) return;
    const lang = await getUserLang(userId);
    const pricing = PRICING[slug];

    if (!pricing) {
      await ctx.editMessageText(getTranslation(lang, 'pricing.text'), { parse_mode: 'HTML' });
      setLastBotMessage(userId, ctx.callbackQuery!.message!.message_id);
      return;
    }

    const title = pricing.title[lang];
    const suffix = lang === 'ru' ? 'пакеты и цены' : 'pricing';

    const text =
      `<b>${title} — ${suffix}</b>\n\n` +
      formatPackages(pricing.packages, lang) +
      `\n\n<i>${lang === 'ru' ? 'Точная стоимость зависит от задачи. Оставьте заявку, обсудим.' : 'Final amount depends on the task. Leave a brief and we will discuss.'}</i>`;

    await ctx.editMessageText(text, {
      parse_mode: 'HTML',
      reply_markup: {
        inline_keyboard: [
          [{ text: getTranslation(lang, 'menu.brief'), callback_data: `brief_start_${slug}` }],
          [
            { text: getTranslation(lang, 'buttons.back'), callback_data: `svc_${slug}` },
            { text: getTranslation(lang, 'buttons.menu'), callback_data: 'menu_home' },
          ],
        ],
      },
    });
    setLastBotMessage(userId, ctx.callbackQuery!.message!.message_id);
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