import type { Bot } from 'grammy';
import { getTranslation, getUserLang } from '../../i18n';
import { SERVICE_SLUGS, SERVICE_INFO } from '../menus-data';
import { setLastBotMessage } from '../message-tracker';

export function installServices(bot: Bot): void {
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
    setLastBotMessage(userId, ctx.callbackQuery!.message!.message_id);
  });

  bot.callbackQuery(/^svc_(.+)$/, async (ctx) => {
    await ctx.answerCallbackQuery();
    const slug = (ctx.match as RegExpMatchArray)[1];
    const userId = ctx.from?.id;
    if (!userId) return;
    const lang = await getUserLang(userId);
    const info = SERVICE_INFO[slug];
    const title = getTranslation(lang, `services_list.${slug}`);

    const whatText = info ? info.what[lang] : '—';
    const stagesText = info ? info.stages[lang] : '—';

    await ctx.editMessageText(
      `<b>${title}</b>\n\n<b>${lang === 'ru' ? 'Что делаем' : 'What we do'}:</b>\n${whatText}\n\n<b>${lang === 'ru' ? 'Этапы и сроки' : 'Stages and timelines'}:</b>\n${stagesText}`,
      {
        parse_mode: 'HTML',
        reply_markup: {
          inline_keyboard: [
            [{ text: getTranslation(lang, 'menu.pricing'), callback_data: `menu_pricing_${slug}` }],
            [{ text: getTranslation(lang, 'menu.brief'), callback_data: `brief_start_${slug}` }],
            [
              { text: getTranslation(lang, 'buttons.back'), callback_data: 'menu_services' },
              { text: getTranslation(lang, 'buttons.menu'), callback_data: 'menu_home' },
            ],
          ],
        },
      },
    );
    setLastBotMessage(userId, ctx.callbackQuery!.message!.message_id);
  });
}