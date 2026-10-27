import type { Lang } from '../types';

export const SERVICE_SLUGS = ['telegram-bots', 'ai-agents', 'automation', 'crm', 'mobile-apps', 'web-apps'];

interface Localized {
  ru: string;
  en: string;
}

interface ServiceInfo {
  what: Localized;
  stages: Localized;
}

export const SERVICE_INFO: Record<string, ServiceInfo> = {
  'telegram-bots': {
    what: {
      ru: '• Боты для продаж и поддержки\n• Mini Apps с оплатой внутри\n• Интеграции с CRM и платежами',
      en: '• Bots for sales and support\n• Mini Apps with built-in payments\n• Integrations with CRM and payments',
    },
    stages: {
      ru: '1–2 недели — прототип\n3–6 недель — MVP\n2–3 недели — тесты и запуск',
      en: '1–2 weeks — prototype\n3–6 weeks — MVP\n2–3 weeks — testing and launch',
    },
  },
  'ai-agents': {
    what: {
      ru: '• Ассистенты для поддержки клиентов\n• Агенты для обработки заявок\n• RAG на ваших документах',
      en: '• Customer support assistants\n• Agents for processing requests\n• RAG on your documents',
    },
    stages: {
      ru: '2–3 недели — прототип\n4–8 недель — MVP\n2 недели — тесты',
      en: '2–3 weeks — prototype\n4–8 weeks — MVP\n2 weeks — testing',
    },
  },
  automation: {
    what: {
      ru: '• Автоматизация рутины\n• Интеграции сервисов\n• Скрипты и вебхуки',
      en: '• Routine automation\n• Service integrations\n• Scripts and webhooks',
    },
    stages: {
      ru: '1–2 недели — аудит\n2–4 недели — внедрение\n1 неделя — тесты',
      en: '1–2 weeks — audit\n2–4 weeks — implementation\n1 week — testing',
    },
  },
  crm: {
    what: {
      ru: '• Настройка и внедрение\n• Кастомные воронки\n• Миграция данных',
      en: '• Setup and implementation\n• Custom pipelines\n• Data migration',
    },
    stages: {
      ru: '1–2 недели — аудит\n4–8 недель — внедрение\n2 недели — обучение',
      en: '1–2 weeks — audit\n4–8 weeks — implementation\n2 weeks — training',
    },
  },
  'mobile-apps': {
    what: {
      ru: '• iOS и Android\n• React Native / Flutter\n• Публикация в сторах',
      en: '• iOS and Android\n• React Native / Flutter\n• Publishing to stores',
    },
    stages: {
      ru: '2–3 недели — дизайн\n6–10 недель — разработка\n2 недели — публикация',
      en: '2–3 weeks — design\n6–10 weeks — development\n2 weeks — publishing',
    },
  },
  'web-apps': {
    what: {
      ru: '• SPA и SSR\n• Личные кабинеты и дашборды\n• API и интеграции',
      en: '• SPA and SSR\n• Accounts and dashboards\n• API and integrations',
    },
    stages: {
      ru: '2 недели — дизайн\n4–8 недель — разработка\n1–2 недели — тесты',
      en: '2 weeks — design\n4–8 weeks — development\n1–2 weeks — testing',
    },
  },
};

export interface PricingPackage {
  name: Localized;
  duration: Localized;
  price: Localized;
  features: Localized;
}

export const PRICING: Record<string, { title: Localized; packages: PricingPackage[] }> = {
  'telegram-bots': {
    title: { ru: 'Telegram-боты и Mini Apps', en: 'Telegram bots and Mini Apps' },
    packages: [
      {
        name: { ru: 'Лид-бот и FAQ', en: 'Lead and FAQ bot' },
        duration: { ru: 'до 4 дней', en: 'up to 4 days' },
        price: { ru: 'от 3 000 ₽', en: 'from $40' },
        features: {
          ru: '• Меню, ответы на частые вопросы и запись\n• Заявки приходят в Telegram или на почту\n• Запуск и тесты на реальных устройствах',
          en: '• Menu, answers to common questions and booking\n• Requests reach you in Telegram or by e-mail\n• Launch and testing on real devices',
        },
      },
      {
        name: { ru: 'Бот продаж с оплатой', en: 'Sales bot with payments' },
        duration: { ru: '1–2 недели', en: '1–2 weeks' },
        price: { ru: 'от 5 000 ₽', en: 'from $60' },
        features: {
          ru: '• Каталог, корзина и статус заказа\n• Оплата картой, СБП или Telegram Stars\n• Админка для заказов и рассылок',
          en: '• Catalogue, cart and order status\n• Payment by card, SBP or Telegram Stars\n• Admin panel for orders and broadcasts',
        },
      },
      {
        name: { ru: 'Telegram Mini App', en: 'Telegram Mini App' },
        duration: { ru: '2–3 недели', en: '2–3 weeks' },
        price: { ru: 'от 6 000 ₽', en: 'from $70' },
        features: {
          ru: '• Полноценный экран приложения внутри Telegram\n• Личный кабинет, оплата и подписки\n• Связка с CRM или бухгалтерией',
          en: '• A full app screen inside Telegram\n• User account, payments and subscriptions\n• Connection to your CRM or accounting',
        },
      },
    ],
  },
  'ai-agents': {
    title: { ru: 'AI-агенты и LLM-интеграции', en: 'AI agents and LLM integration' },
    packages: [
      {
        name: { ru: 'Прототип на ваших данных', en: 'Prototype on your data' },
        duration: { ru: '1–2 недели', en: '1–2 weeks' },
        price: { ru: 'от 5 000 ₽', en: 'from $60' },
        features: {
          ru: '• Один процесс и одна метрика качества\n• Рабочая версия на реальных документах или заявках\n• Отчёт по точности, стоимости запросов и следующие шаги',
          en: '• One process and one quality metric\n• A working version on real documents or requests\n• Report on accuracy, request costs and next steps',
        },
      },
      {
        name: { ru: 'AI-ассистент с интеграциями', en: 'AI assistant with integrations' },
        duration: { ru: 'от 4 недель', en: 'from 4 weeks' },
        price: { ru: 'от 12 000 ₽', en: 'from $150' },
        features: {
          ru: '• Доступ к вашей CRM, базе знаний и внутренним сервисам\n• Передача человеку и логи\n• Тестовый набор и пилот с командой',
          en: '• Access to your CRM, knowledge base and internal services\n• Hand-off to a person and logs\n• Test set and a pilot with your team',
        },
      },
    ],
  },
  automation: {
    title: { ru: 'Автоматизация бизнес-процессов', en: 'Business process automation' },
    packages: [
      {
        name: { ru: 'Аудит процесса', en: 'Process audit' },
        duration: { ru: '1–3 дня', en: '1–3 days' },
        price: { ru: 'от 1 500 ₽', en: 'from $20' },
        features: {
          ru: '• Проход по процессу и его ручным шагам\n• Оценка времени, освобождённого от рутины\n• Пошаговый план автоматизации',
          en: '• Walk-through of the process and its manual steps\n• Estimate of the time freed from routine\n• Step-by-step automation plan',
        },
      },
      {
        name: { ru: 'Воркфлоу или интеграция', en: 'Workflow or integration' },
        duration: { ru: 'от 3 дней', en: 'from 3 days' },
        price: { ru: 'от 3 000 ₽', en: 'from $40' },
        features: {
          ru: '• Связка двух систем или один воркфлоу\n• Обработка ошибок и уведомления\n• Гайд для команды',
          en: '• Two systems connected or one workflow\n• Error handling and notifications\n• Guide for your team',
        },
      },
      {
        name: { ru: 'Сквозная автоматизация', en: 'End-to-end automation' },
        duration: { ru: 'от 3 недель', en: 'from 3 weeks' },
        price: { ru: 'от 10 000 ₽', en: 'from $120' },
        features: {
          ru: '• Несколько процессов и систем в одном контуре\n• AI-шаги и живой дашборд статусов\n• Пилот, доработки и документация',
          en: '• Several processes and systems in one design\n• AI steps and a live status dashboard\n• Pilot, fixes and documentation',
        },
      },
    ],
  },
  crm: {
    title: { ru: 'Разработка CRM под задачу', en: 'Custom CRM development' },
    packages: [
      {
        name: { ru: 'Модель данных и прототип', en: 'Data model and prototype' },
        duration: { ru: '1–3 недели', en: '1–3 weeks' },
        price: { ru: 'от 6 000 ₽', en: 'from $70' },
        features: {
          ru: '• Анализ того, как идут лиды и заказы\n• Сущности, статусы и роли\n• Кликабельный прототип для менеджеров',
          en: '• Analysis of how leads and orders flow\n• Entities, statuses and roles\n• Clickable prototype for your managers',
        },
      },
      {
        name: { ru: 'CRM под ключ', en: 'Turnkey CRM' },
        duration: { ru: 'от 2 месяцев', en: 'from 2 months' },
        price: { ru: 'от 20 000 ₽', en: 'from $250' },
        features: {
          ru: '• Воронки, задачи, роли и отчёты\n• Интеграции и миграция данных\n• Обучение команды и поддержка после запуска',
          en: '• Pipelines, tasks, roles and reports\n• Integrations and data migration\n• Team training and support after launch',
        },
      },
    ],
  },
  'mobile-apps': {
    title: { ru: 'Мобильные приложения', en: 'Mobile app development' },
    packages: [
      {
        name: { ru: 'Дизайн и прототип', en: 'Design and prototype' },
        duration: { ru: '1–2 недели', en: '1–2 weeks' },
        price: { ru: 'от 6 000 ₽', en: 'from $70' },
        features: {
          ru: '• Сценарии и экраны первого релиза\n• Кликабельный прототип на телефоне\n• Оценка разработки по этапам',
          en: '• Flows and screens of the first release\n• Clickable prototype on a phone\n• Development estimate by stage',
        },
      },
      {
        name: { ru: 'MVP приложения', en: 'App MVP' },
        duration: { ru: 'от 6 недель', en: 'from 6 weeks' },
        price: { ru: 'от 25 000 ₽', en: 'from $300' },
        features: {
          ru: '• iOS и Android, бэкенд и админка\n• Пуш-уведомления и оплата\n• Публикация в App Store и Google Play',
          en: '• iOS and Android, backend and admin panel\n• Push notifications and payments\n• Publishing to the App Store and Google Play',
        },
      },
    ],
  },
  'web-apps': {
    title: { ru: 'SaaS и веб-приложения', en: 'SaaS and web app development' },
    packages: [
      {
        name: { ru: 'Лендинг', en: 'Landing page' },
        duration: { ru: 'от 1 недели', en: 'from 1 week' },
        price: { ru: 'от 3 000 ₽', en: 'from $40' },
        features: {
          ru: '• Дизайн и адаптивная вёрстка\n• Форма заявки и аналитика\n• Публикация и настройка домена',
          en: '• Design and responsive layout\n• Enquiry form and analytics\n• Publishing and domain setup',
        },
      },
      {
        name: { ru: 'MVP веб-приложения', en: 'Web app MVP' },
        duration: { ru: 'от 3 недель', en: 'from 3 weeks' },
        price: { ru: 'от 6 000 ₽', en: 'from $70' },
        features: {
          ru: '• Основной сценарий, аккаунты и роли\n• Админка и оплата\n• Хостинг и мониторинг',
          en: '• Core flow, accounts and roles\n• Admin panel and payments\n• Hosting and monitoring',
        },
      },
      {
        name: { ru: 'SaaS-платформа', en: 'SaaS platform' },
        duration: { ru: 'от 2 месяцев', en: 'from 2 months' },
        price: { ru: 'от 20 000 ₽', en: 'from $250' },
        features: {
          ru: '• Тарифы, подписки и биллинг\n• Публичный API и интеграции\n• Аналитика, мониторинг и рост после запуска',
          en: '• Plans, subscriptions and billing\n• Public API and integrations\n• Analytics, monitoring and growth after launch',
        },
      },
    ],
  },
};