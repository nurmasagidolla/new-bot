import { db } from './schema';
import type { Lang } from './types';

// ============================================
// Промис-обёртки над sqlite3 (db.get / db.all / db.run)
// ============================================
export function dbAll<T = any>(sql: string, params: any[] = []): Promise<T[]> {
  return new Promise((resolve, reject) => {
    db.all(sql, params, (err: Error | null, rows: T[]) => {
      if (err) reject(err);
      else resolve(rows ?? []);
    });
  });
}

export function dbGet<T = any>(sql: string, params: any[] = []): Promise<T | undefined> {
  return new Promise((resolve, reject) => {
    db.get(sql, params, (err: Error | null, row: T | undefined) => {
      if (err) reject(err);
      else resolve(row);
    });
  });
}

export function dbRun(sql: string, params: any[] = []): Promise<void> {
  return new Promise((resolve, reject) => {
    db.run(sql, params, (err: Error | null) => {
      if (err) reject(err);
      else resolve();
    });
  });
}

// ============================================
// Дополнительные таблицы (отдельные имена, чтобы не конфликтовать с вашей схемой)
// Вызывается один раз при старте, после initDb().
// ============================================
export async function initExtraTables(): Promise<void> {
  await dbRun(`
    CREATE TABLE IF NOT EXISTS panel_events (
      seq     INTEGER PRIMARY KEY AUTOINCREMENT,
      at      TEXT NOT NULL,
      payload TEXT NOT NULL,
      acked   INTEGER NOT NULL DEFAULT 0
    )
  `);
  await dbRun(`
    CREATE TABLE IF NOT EXISTS brief_state (
      userId    INTEGER PRIMARY KEY,
      state     TEXT NOT NULL,
      updatedAt TEXT NOT NULL
    )
  `);
}

// ============================================
// Пользователи
// ============================================
export async function upsertUser(userId: number, lang: Lang): Promise<void> {
  const row = await dbGet(`SELECT userId FROM users WHERE userId = ?`, [userId]);
  if (!row) {
    await dbRun(
      `INSERT INTO users (userId, lang, subscribed, createdAt) VALUES (?, ?, 0, ?)`,
      [userId, lang, new Date().toISOString()],
    );
  }
}

// ============================================
// События для панели
// ============================================
export interface EventRow {
  seq: number;
  payload: string;
}

export async function addEvent(payload: Record<string, unknown>): Promise<void> {
  await dbRun(`INSERT INTO panel_events (at, payload) VALUES (?, ?)`, [
    new Date().toISOString(),
    JSON.stringify(payload),
  ]);
}

export function getEvents(after: number, limit: number): Promise<EventRow[]> {
  return dbAll<EventRow>(
    `SELECT seq, payload FROM panel_events WHERE seq > ? AND acked = 0 ORDER BY seq ASC LIMIT ?`,
    [after, limit],
  );
}

export async function ackEvents(upTo: number): Promise<void> {
  await dbRun(`UPDATE panel_events SET acked = 1 WHERE seq <= ?`, [upTo]);
}

// ============================================
// Очистка старых данных (раз в час из index.ts)
// ============================================
export async function cleanupOldData(): Promise<void> {
  const cutoff = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
  await dbRun(`DELETE FROM panel_events WHERE acked = 1 AND at < ?`, [cutoff]);
  await dbRun(`DELETE FROM brief_state WHERE updatedAt < ?`, [cutoff]);
}