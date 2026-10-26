import { Lang } from './types';

export const texts = {
  ru: {
    welcome: 'Привет! Это Cloutlab, студия разработки. Делаем сайты и веб-приложения, мобильные приложения, Telegram-ботов, CRM, AI-агентов и автоматизацию. Выберите раздел в меню.',
    error: 'Что-то пошло не так. Попробуйте ещё раз через минуту.',
    unknownCmd: 'Я понимаю кнопки меню. Чтобы задать вопрос человеку, нажмите «Написать нам».',
  },
  en: {
    welcome: 'Hi! This is Cloutlab, a software studio. We build websites and web apps, mobile apps, Telegram bots, CRMs, AI agents and automations. Pick a section below.',
    error: 'Something went wrong. Please try again in a minute.',
    unknownCmd: 'I work with the menu buttons. To ask a person, tap Message us.',
  }
};

export function getTranslation(lang: Lang, key: keyof typeof texts['ru']): string {
  return texts[lang][key] || texts.en[key] || key;
}