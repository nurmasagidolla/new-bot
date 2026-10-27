import { db, dbGet, dbAll, dbRun } from './schema';

export { dbGet, dbAll, dbRun };

export async function initExtraTables(): Promise<void> {
  // все таблицы создаются в initDb() (schema.ts)
}

export async function upsertUser(userId: number, lang: string, source: string | null = null): Promise<void> {
  await dbRun(
    `INSERT INTO users (userId, lang, source, subscribed, createdAt)
     VALUES (?, ?, ?, 0, ?)
     ON CONFLICT(userId) DO UPDATE SET
       lang = COALESCE(excluded.lang, users.lang),
       source = COALESCE(users.source, excluded.source)`,
    [userId, lang, source, new Date().toISOString()],
  );
}

export async function addEvent(type: string, payload: unknown): Promise<void> {
  await dbRun(
    `INSERT INTO events (type, payload, isAcked, createdAt) VALUES (?, ?, 0, ?)`,
    [type, JSON.stringify(payload), new Date().toISOString()],
  );
}

export async function getEvents(after: number, limit: number): Promise<any[]> {
  return dbAll(
    `SELECT seq, type, payload FROM events WHERE seq > ? AND isAcked = 0 ORDER BY seq ASC LIMIT ?`,
    [after, Math.min(limit, 100)],
  );
}

export async function ackEvents(upTo: number): Promise<void> {
  await dbRun(`UPDATE events SET isAcked = 1 WHERE seq <= ?`, [upTo]);
  await dbRun(`DELETE FROM events WHERE isAcked = 1`);
}

export async function cleanupOldData(): Promise<void> {
  await dbRun(`DELETE FROM brief_state WHERE updatedAt < datetime('now', '-1 day')`);
  await dbRun(`DELETE FROM leads WHERE at < datetime('now', '-30 day')`);
}