import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import http from 'http';
import { Bot } from 'grammy';
import { createPanelServer } from '../src/api';
import { initDb } from '../src/schema';
import { initExtraTables, addEvent } from '../src/db-queries';

const TOKEN = process.env.PANEL_API_TOKEN!;
let server: http.Server;
let baseUrl: string;
let bot: Bot;

beforeAll(async () => {
  initDb();
  await initExtraTables();

  bot = new Bot('123456789:TEST_TOKEN');
  (bot.api as any).sendMessage = async () => ({ message_id: 1 });

  server = createPanelServer(bot);
  await new Promise<void>((resolve) => {
    server.listen(0, '127.0.0.1', () => resolve());
  });
  const addr = server.address() as { port: number };
  baseUrl = `http://127.0.0.1:${addr.port}`;
});

afterAll(async () => {
  await new Promise<void>((resolve) => server.close(() => resolve()));
});

describe('GET /health', () => {
  it('200 без токена', async () => {
    const res = await request(baseUrl).get('/health');
    expect(res.status).toBe(200);
    expect(res.body.ok).toBe(true);
  });
});

describe('GET /leads', () => {
  it('401 без токена', async () => {
    const res = await request(baseUrl).get('/leads');
    expect(res.status).toBe(401);
    expect(res.body.error).toBe('Unauthorized');
  });

  it('401 с неверным токеном', async () => {
    const res = await request(baseUrl)
      .get('/leads')
      .set('Authorization', 'Bearer wrong_token');
    expect(res.status).toBe(401);
  });

  it('200 с токеном и пустым массивом', async () => {
    const res = await request(baseUrl)
      .get('/leads')
      .set('Authorization', `Bearer ${TOKEN}`);
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.leads)).toBe(true);
    expect(res.body.next).toBeDefined();
    expect(res.body.last).toBeDefined();
  });

  it('уважает ?limit=1', async () => {
    const res = await request(baseUrl)
      .get('/leads?limit=1')
      .set('Authorization', `Bearer ${TOKEN}`);
    expect(res.status).toBe(200);
    expect(res.body.leads.length).toBeLessThanOrEqual(1);
  });
});

describe('GET /events + POST /events/ack', () => {
  it('отдаёт событие и удаляет после ack', async () => {
    await addEvent('link', { code: 'test123', tgUserId: 999 });

    const list1 = await request(baseUrl)
      .get('/events')
      .set('Authorization', `Bearer ${TOKEN}`);
    expect(list1.status).toBe(200);
    expect(list1.body.events.length).toBeGreaterThan(0);

    const seq = list1.body.events[0].seq;

    const ack = await request(baseUrl)
      .post('/events/ack')
      .set('Authorization', `Bearer ${TOKEN}`)
      .send({ upTo: seq });
    expect(ack.status).toBe(200);
    expect(ack.body.ok).toBe(true);

    const list2 = await request(baseUrl)
      .get('/events')
      .set('Authorization', `Bearer ${TOKEN}`);
    expect(list2.body.events.find((e: any) => e.seq === seq)).toBeUndefined();
  });

  it('400 на невалидный upTo', async () => {
    const ack = await request(baseUrl)
      .post('/events/ack')
      .set('Authorization', `Bearer ${TOKEN}`)
      .send({ upTo: 'not_a_number' });
    expect(ack.status).toBe(400);
  });
});