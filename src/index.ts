import { Bot } from 'grammY';
import http from 'http';
import { config } from './config';
import { db, initDb } from './schema';
import { logger } from './logger';
import { checkRateLimit } from './rate-limiter';
import { getTranslation } from './i18n';
import { Lang } from './types';

initDb();
const bot = new Bot(config.botToken);

bot.use(async (ctx, next) => {
  const userId = ctx.from?.id;
  if (userId && !checkRateLimit(userId)) {
    return;
  }
  await next();
});

bot.command('start', async (ctx) => {
  const userId = ctx.from?.id;
  if (!userId) return;

  const langCode = ctx.from?.language_code || 'en';
  const defaultLang: Lang = ['ru', 'uk', 'be', 'kk'].includes(langCode) ? 'ru' : 'en';

  db.get(`SELECT * FROM users WHERE userId = ?`, [userId], (err, row: any) => {
    if (!row) {
      db.run(`INSERT INTO users (userId, lang, subscribed, createdAt) VALUES (?, ?, 0, ?)`, 
        [userId, defaultLang, new Date().toISOString()]);
    }
  });

  await ctx.reply(getTranslation(defaultLang, 'welcome'));
});

// HTTP сервер для панели бэкендера
const server = http.createServer(async (req, res) => {
  const authHeader = req.headers['authorization'];
  
  if (req.url === '/health') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ ok: true }));
    return;
  }

  if (!authHeader || authHeader !== `Bearer ${config.panelApiToken}`) {
    res.writeHead(401, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: 'Unauthorized' }));
    return;
  }

  if (req.url?.startsWith('/leads')) {
    db.all(`SELECT seq, at, encryptedData FROM leads LIMIT 100`, [], (err, rows: any[]) => {
      const leads = rows.map(r => ({ seq: r.seq, at: r.at, age: r.encryptedData }));
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ leads, next: 0, last: rows.length ? rows[rows.length - 1].seq : 0 }));
    });
    return;
  }

  res.writeHead(404, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify({ error: 'Not Found' }));
});

server.listen(config.panelApiPort, config.panelApiHost, () => {
  logger.info(`Panel API running on ${config.panelApiHost}:${config.panelApiPort}`);
});

bot.start();
logger.info('Cloutlab Telegram Bot started successfully.');