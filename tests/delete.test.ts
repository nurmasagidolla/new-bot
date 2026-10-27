import { describe, it, expect, beforeEach } from 'vitest';
import { dbRun, dbGet } from '../src/db-queries';
import { saveBrief } from '../src/fsm/brief';

beforeEach(async () => {
  await dbRun('DELETE FROM users');
  await dbRun('DELETE FROM brief_state');
});

describe('/delete', () => {
  it('удаляет пользователя и черновики', async () => {
    const userId = 777;

    await dbRun(
      `INSERT INTO users (userId, lang, subscribed, createdAt) VALUES (?, 'ru', 0, ?)`,
      [userId, new Date().toISOString()],
    );
    await saveBrief(userId, { step: 'consent' });

    const userBefore = await dbGet(`SELECT * FROM users WHERE userId = ?`, [userId]);
    expect(userBefore).toBeDefined();

    await dbRun(`DELETE FROM brief_state WHERE userId = ?`, [userId]);
    await dbRun(`DELETE FROM users WHERE userId = ?`, [userId]);

    const userAfter = await dbGet(`SELECT * FROM users WHERE userId = ?`, [userId]);
    const draftAfter = await dbGet(`SELECT * FROM brief_state WHERE userId = ?`, [userId]);

    expect(userAfter).toBeUndefined();
    expect(draftAfter).toBeUndefined();
  });
});