import satori from 'satori';
import { Resvg } from '@resvg/resvg-js';
import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import ru from '../src/locales/ru.ts';  // ← нужно собрать (tsc → dist)
import en from '../src/locales/en.ts';

const __dirname = dirname(fileURLToPath(import.meta.url));
const CARDS_DIR = join(__dirname, '..', 'assets', 'cards');
const FONTS_DIR = join(__dirname, 'fonts');

const tektruBold = readFileSync(join(FONTS_DIR, 'Tektur-Bold.ttf'));
const onestRegular = readFileSync(join(FONTS_DIR, 'Onest-Regular.ttf'));

const THEME = {
  bg: '#05050a',
  bg2: '#0c0c17',
  text: '#eef0ff',
  muted: '#9598b8',
  cyan: '#00f0ff',
  magenta: '#ff2bd6',
  lime: '#b6ff3b',
  line: 'rgba(150,160,255,0.16)',
};

function svgToPng(svg, width = 1280, height = 720) {
  const resvg = new Resvg(svg, { fitTo: { mode: 'width', value: width } });
  return resvg.render().asPng();
}

async function renderCard({ title, subtitle, badge, accent, progress }) {
  // Шаблон: заголовок + подзаголовок + логотип + линии + свечение
  const jsx = {
    type: 'div',
    props: {
      style: {
        display: 'flex',
        flexDirection: 'column',
        width: '1280px',
        height: '720px',
        background: `linear-gradient(135deg, ${THEME.bg}, ${THEME.bg2})`,
        color: THEME.text,
        padding: '60px',
        fontFamily: 'Onest',
        position: 'relative',
        overflow: 'hidden',
      },
      children: [
        // Сетка линий (декоративно)
        {
          type: 'div',
          props: {
            style: {
              position: 'absolute',
              inset: 0,
              backgroundImage: `linear-gradient(${THEME.line} 1px, transparent 1px), linear-gradient(90deg, ${THEME.line} 1px, transparent 1px)`,
              backgroundSize: '80px 80px',
              opacity: 0.4,
            },
          },
        },
        // Свечение (акцент)
        {
          type: 'div',
          props: {
            style: {
              position: 'absolute',
              width: '600px',
              height: '600px',
              borderRadius: '50%',
              background: `radial-gradient(circle, ${accent || THEME.cyan}, transparent 70%)`,
              opacity: 0.15,
              top: '-200px',
              right: '-200px',
            },
          },
        },
        // Логотип (текстом)
        {
          type: 'div',
          props: {
            style: {
              fontFamily: 'Tektur',
              fontWeight: 700,
              fontSize: '28px',
              color: THEME.text,
              letterSpacing: '2px',
              marginBottom: 'auto',
              zIndex: 1,
            },
            children: 'CLOUTLAB',
          },
        },
        // Заголовок
        {
          type: 'div',
          props: {
            style: {
              fontFamily: 'Tektur',
              fontWeight: 700,
              fontSize: '72px',
              textTransform: 'uppercase',
              letterSpacing: '2px',
              color: THEME.text,
              marginBottom: '24px',
              zIndex: 1,
            },
            children: title,
          },
        },
        // Подзаголовок
        subtitle && {
          type: 'div',
          props: {
            style: {
              fontSize: '28px',
              color: THEME.muted,
              lineHeight: 1.4,
              maxWidth: '900px',
              zIndex: 1,
            },
            children: subtitle,
          },
        },
        // Прогресс (для шагов)
        progress && {
          type: 'div',
          props: {
            style: {
              marginTop: '40px',
              width: '400px',
              height: '8px',
              background: THEME.line,
              borderRadius: '4px',
              zIndex: 1,
              position: 'relative',
            },
            children: [
              {
                type: 'div',
                props: {
                  style: {
                    width: `${(progress.current / progress.total) * 100}%`,
                    height: '100%',
                    background: THEME.cyan,
                    borderRadius: '4px',
                  },
                },
              },
            ],
          },
        },
        // Бейдж (акцент)
        badge && {
          type: 'div',
          props: {
            style: {
              marginTop: '40px',
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              fontSize: '20px',
              color: accent || THEME.cyan,
              zIndex: 1,
            },
            children: `→ ${badge}`,
          },
        },
      ].filter(Boolean),
    },
  };

  const svg = await satori(jsx, {
    width: 1280,
    height: 720,
    fonts: [
      { name: 'Tektur', data: tektruBold, weight: 700, style: 'normal' },
      { name: 'Onest', data: onestRegular, weight: 400, style: 'normal' },
    ],
  });

  return svgToPng(svg);
}

async function generate() {
  const screens = [
    { id: 'main-menu', title: 'Cloutlab', subtitle: 'Студия разработки', accent: THEME.cyan },
    { id: 'services', title: 'Услуги', subtitle: 'Выберите направление', accent: THEME.magenta },
    { id: 'step-1-consent', title: 'Согласие', subtitle: 'Шаг 1 из 9', accent: THEME.cyan, progress: { current: 1, total: 9 } },
    { id: 'step-2-service', title: 'Что нужно сделать?', subtitle: 'Шаг 2 из 9', accent: THEME.cyan, progress: { current: 2, total: 9 } },
    // ... добавить остальные экраны
  ];

  for (const lang of ['ru', 'en']) {
    const dir = join(CARDS_DIR, lang);
    if (!existsSync(dir)) mkdirSync(dir, { recursive: true });

    for (const screen of screens) {
      const png = await renderCard({
        ...screen,
        title: lang === 'ru' ? screen.title : screen.title.toUpperCase(), // упрощённо
        subtitle: lang === 'ru' ? screen.subtitle : screen.subtitle,
      });
      const file = join(dir, `${screen.id}.png`);
      writeFileSync(file, png);
      console.log(`✅ ${lang}/${screen.id}.png`);
    }
  }

  console.log('\n🎉 Готово! Проверь assets/cards/');
}

generate().catch((e) => {
  console.error('❌', e);
  process.exit(1);
});