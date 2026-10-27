import { Bot } from 'grammy';
import { readFileSync, writeFileSync, readdirSync } from 'fs';
import { join, basename, extname } from 'path';
import { config } from '../dist/config.js';  // ← собрать dist

const bot = new Bot(config.botToken);
const CARDS_DIR = join(process.cwd(), 'assets', 'cards');
const OUT = join(process.cwd(), 'src', 'cards.json');

async function upload() {
  const result = {};

  for (const lang of ['ru', 'en']) {
    const dir = join(CARDS_DIR, lang);
    const files = readdirSync(dir).filter((f) => f.endsWith('.png'));

    for (const file of files) {
      const id = basename(file, '.png');
      const buffer = readFileSync(join(dir, file));

      const msg = await bot.api.sendPhoto(config.adminIds[0], buffer, {
        caption: `Card: ${lang}/${id}`,
      });

      // file_id — берём photo[last].file_id
      const fileId = msg.photo[msg.photo.length - 1].file_id;
      result[`${id}.${lang}`] = fileId;
      console.log(`✅ ${id}.${lang} → ${fileId}`);
    }
  }

  writeFileSync(OUT, JSON.stringify(result, null, 2));
  console.log(`\n🎉 Сохранено в ${OUT}`);
}

upload().catch((e) => {
  console.error('❌', e);
  process.exit(1);
});