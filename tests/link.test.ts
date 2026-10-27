import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import http from 'http';
import { Bot } from 'grammy';
import { createPanelServer } from '../src/api';
import { initDb } from '../src/schema';
import { dbRun, addEvent, getEvents } from '../src/db-queries';

const TOKEN = process.env.PANEL_API_TOKEN!;
let server: http.Server;
let baseUrl: string;
let bot: Bot;

beforeAll(async () => {
  initDb();
  bot = new Bot('123456789:TEST_TOKEN');
  server = createPanelServer(bot);
  await new Promise<void>((resolve) => server.listen(0, '127.0.0.1', () => resolve()));
  const addr = server.address() as { port: number };
  baseUrl = `http://127.0.0.1:${addr.port}`;
});

afterAll(async () => {
  await new Promise<void>((resolve) => server.close(() => resolve()));
});

describe('Привязка кабинета', () => {
  it('валидный код → событие link', async () => {
    await dbRun('DELETE FROM events');

    const userId = 111;
    const code = 'a1b2c3d4e5f6g7h8i9j0';

    await addEvent('link', { code, tgUserId: userId, username: 'test_user', lang: 'ru' });

    const events = await getEvents(0, 10);
    expect(events.length).toBe(1);

    const linkEvent = events.find((e: any) => e.type === 'link');
    expect(linkEvent).toBeDefined();

    const payload = JSON.parse(linkEvent.payload);
    expect(payload.code).toBe(code);
    expect(payload.tgUserId).toBe(userId);
  });

  it('невалидный код не пишет событие', async () => {
    await dbRun('DELETE FROM events');
    const code = 'short';
    expect(/^[A-Za-z0-9_-]{16,48}$/.test(code)).toBe(false);
  });

  it('GET /events отдаёт link, POST /events/ack удаляет', async () => {
    await dbRun('DELETE FROM events');
    await addEvent('link', { code: 'test1234567890123456', tgUserId: 333 });

    const list1 = await request(baseUrl)
      .get('/events')
      .set('Authorization', `Bearer ${TOKEN}`);
    expect(list1.status).toBe(200);
    expect(list1.body.events.length).toBe(1);

    const seq = list1.body.events[0].seq;

    const ack = await request(baseUrl)
      .post('/events/ack')
      .set('Authorization', `Bearer ${TOKEN}`)
      .send({ upTo: seq });
    expect(ack.status).toBe(200);

    const list2 = await request(baseUrl)
      .get('/events')
      .set('Authorization', `Bearer ${TOKEN}`);
    expect(list2.body.events.length).toBe(0);
  });
});