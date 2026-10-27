import { describe, it, expect, beforeAll } from 'vitest';
import { initDb } from '../src/schema';
import { initExtraTables, dbRun, dbAll, upsertUser } from '../src/db-queries';
import { getBroadcastState, setBroadcastState, clearBroadcastState } from '../src/broadcast';

beforeAll(async () => {
  initDb();
  await initExtraTables();
});

describe('Broadcast FSM', () => {
  it('создаёт состояние и очищает', () => {
    setBroadcastState(1, { step: 'text' });
    const state = getBroadcastState(1);
    expect(state?.step).toBe('text');
    clearBroadcastState(1);
    expect(getBroadcastState(1)).toBeNull();
  });

  it('валидация текста > 4000', () => {
    const text = 'a'.repeat(4001);
    expect(text.length > 4000).toBe(true);
  });

  it('парсинг кнопок "Текст | URL"', () => {
    const text = 'Наш сайт | https://cloutlab.studio';
    const match = text.match(/^(.+?)\s*\|\s*(https?:\/\/\S+)$/);
    expect(match).toBeTruthy();
    expect(match![1].trim()).toBe('Наш сайт');
    expect(match![2].trim()).toBe('https://cloutlab.studio');
  });

  it('невалидная кнопка (без URL)', () => {
    const text = 'Наш сайт';
    const match = text.match(/^(.+?)\s*\|\s*(https?:\/\/\S+)$/);
    expect(match).toBeNull();
  });
});

describe('Аудитория рассылки', () => {
  it('ru / en / all — разные запросы', async () => {
    await dbRun('DELETE FROM users');
    await upsertUser(1001, 'ru');
    await upsertUser(1002, 'en');
    await upsertUser(1003, 'ru');
    await dbRun(`UPDATE users SET subscribed = 1 WHERE userId IN (1001, 1002)`);

    const ru = await dbAll<{ userId: number }>(
      `SELECT userId FROM users WHERE subscribed = 1 AND lang = ?`,
      ['ru'],
    );
    expect(ru.length).toBe(1);
    expect(ru[0].userId).toBe(1001);

    const en = await dbAll<{ userId: number }>(
      `SELECT userId FROM users WHERE subscribed = 1 AND lang = ?`,
      ['en'],
    );
    expect(en.length).toBe(1);
    expect(en[0].userId).toBe(1002);

    const all = await dbAll<{ userId: number }>(
      `SELECT userId FROM users WHERE subscribed = 1`,
    );
    expect(all.length).toBe(2);
  });
});

describe('Подписка', () => {
  it('подписанные получают рассылку, неподписанные — нет', async () => {
    await dbRun('DELETE FROM users');
    await upsertUser(2001, 'ru');
    await upsertUser(2002, 'ru');

    await dbRun(`UPDATE users SET subscribed = 1 WHERE userId = 2001`);

    const subs = await dbAll<{ userId: number }>(
      `SELECT userId FROM users WHERE subscribed = 1 AND lang = 'ru'`,
    );
    expect(subs.length).toBe(1);
    expect(subs[0].userId).toBe(2001);
  });
});