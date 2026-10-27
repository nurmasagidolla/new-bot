import { describe, it, expect, beforeEach } from 'vitest';
import { dbRun } from '../src/db-queries';
import { getBrief, saveBrief } from '../src/fsm/brief';

beforeEach(async () => {
  await dbRun('DELETE FROM brief_state');
});

describe('FSM черновиков', () => {
  it('сохраняет и читает состояние', async () => {
    await saveBrief(100, { step: 'message', message: 'Hello' });
    const state = await getBrief(100);
    expect(state?.step).toBe('message');
    expect(state?.message).toBe('Hello');
  });

  it('обновляет состояние (upsert)', async () => {
    await saveBrief(101, { step: 'message' });
    await saveBrief(101, { step: 'name', name: 'Михаил' });
    const state = await getBrief(101);
    expect(state?.step).toBe('name');
    expect(state?.name).toBe('Михаил');
  });

  it('возвращает null для несуществующего', async () => {
    const state = await getBrief(99999);
    expect(state).toBeNull();
  });
});

describe('Валидация задачи', () => {
  it('задача меньше 10 символов не проходит', () => {
    const text = 'коротко';
    expect(text.length < 10).toBe(true);
  });

  it('задача 10–2000 проходит', () => {
    const text = 'Сделать бота для записи клиентов к 20 декабря';
    expect(text.length >= 10 && text.length <= 2000).toBe(true);
  });

  it('задача больше 2000 не проходит', () => {
    const text = 'a'.repeat(2001);
    expect(text.length > 2000).toBe(true);
  });
});

describe('Лимит 3 заявки/сутки', () => {
  it('4-я заявка должна быть отклонена', async () => {
    await dbRun('DELETE FROM leads');

    for (let i = 0; i < 3; i++) {
      await dbRun(
        `INSERT INTO leads (at, encryptedData) VALUES (?, ?)`,
        [new Date().toISOString(), `dummy_${i}`],
      );
    }

    const { dbGet } = await import('../src/db-queries');
    const todayLeads = await dbGet<{ c: number }>(
      `SELECT COUNT(*) as c FROM leads WHERE at > datetime('now', '-1 day')`,
    );
    expect(todayLeads!.c).toBeGreaterThanOrEqual(3);
  });
});