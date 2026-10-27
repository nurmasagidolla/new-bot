import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import http from 'http';
import { Bot } from 'grammy';
import { createPanelServer } from '../src/api';
import { initDb } from '../src/schema';
import { initExtraTables, upsertUser } from '../src/db-queries';

const TOKEN = process.env.PANEL_API_TOKEN!;
let server: http.Server;
let baseUrl: string;
let bot: Bot;
const sentMessages: Array<{ chat_id: number; text: string }> = [];

beforeAll(async () => {
  initDb();
  await initExtraTables();

  bot = new Bot('123456789:TEST_TOKEN');

  (bot.api as any).sendMessage = async (chatId: number, text: string) => {
    sentMessages.push({ chat_id: chatId, text });
    return { message_id: 1000 + sentMessages.length };
  };

  server = createPanelServer(bot);
  await new Promise<void>((resolve) => server.listen(0, '127.0.0.1', () => resolve()));
  const addr = server.address() as { port: number };
  baseUrl = `http://127.0.0.1:${addr.port}`;
});

afterAll(async () => {
  await new Promise<void>((resolve) => server.close(() => resolve()));
});

describe('POST /notify', () => {
  it('401 без токена', async () => {
    const res = await request(baseUrl).post('/notify').send({});
    expect(res.status).toBe(401);
  });

  it('400 без обязательных полей', async () => {
    const res = await request(baseUrl)
      .post('/notify')
      .set('Authorization', `Bearer ${TOKEN}`)
      .send({});
    expect(res.status).toBe(400);
  });

  it('ok:false not_found для несуществующего пользователя', async () => {
    const res = await request(baseUrl)
      .post('/notify')
      .set('Authorization', `Bearer ${TOKEN}`)
      .send({ key: 'k1', tgUserId: 99999, template: 'linked' });
    expect(res.status).toBe(200);
    expect(res.body.ok).toBe(false);
    expect(res.body.error).toBe('not_found');
  });

  it('linked: отправляет и сохраняет', async () => {
    await upsertUser(555, 'ru');
    const res = await request(baseUrl)
      .post('/notify')
      .set('Authorization', `Bearer ${TOKEN}`)
      .send({ key: 'k2', tgUserId: 555, template: 'linked' });
    expect(res.status).toBe(200);
    expect(res.body.ok).toBe(true);
    expect(res.body.messageId).toBeGreaterThan(0);
  });

  it('идемпотентность: повтор с тем же key не шлёт', async () => {
    const before = sentMessages.length;
    const res = await request(baseUrl)
      .post('/notify')
      .set('Authorization', `Bearer ${TOKEN}`)
      .send({ key: 'k2', tgUserId: 555, template: 'linked' });
    expect(res.body.ok).toBe(true);
    expect(sentMessages.length).toBe(before);
  });

  it('invoice: с кнопкой оплаты', async () => {
    await upsertUser(556, 'en');
    const res = await request(baseUrl)
      .post('/notify')
      .set('Authorization', `Bearer ${TOKEN}`)
      .send({
        key: 'k3',
        tgUserId: 556,
        template: 'invoice',
        params: {
          title: 'Website',
          amount: '150000',
          url: 'https://pay.example.com',
          expiresAt: '2030-01-01T00:00:00Z',
        },
      });
    expect(res.body.ok).toBe(true);
    const last = sentMessages[sentMessages.length - 1];
    expect(last.text).toContain('Invoice');
    expect(last.text).toContain('150000');
  });

  it('invoice expired: без кнопки, с пометкой', async () => {
    await upsertUser(557, 'ru');
    const res = await request(baseUrl)
      .post('/notify')
      .set('Authorization', `Bearer ${TOKEN}`)
      .send({
        key: 'k4',
        tgUserId: 557,
        template: 'invoice',
        params: {
          title: 'Сайт',
          amount: '1000',
          url: 'https://pay.example.com',
          expiresAt: '2020-01-01T00:00:00Z',
        },
      });
    expect(res.body.ok).toBe(true);
    const last = sentMessages[sentMessages.length - 1];
    expect(last.text).toContain('Ссылка устарела');
  });
});