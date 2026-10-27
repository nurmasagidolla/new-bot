import sqlite3 from '@karinjs/sqlite3';
import path from 'path';
import fs from 'fs';
import { config } from './config';

if (!fs.existsSync(config.dataDir)) {
  fs.mkdirSync(config.dataDir, { recursive: true });
}

const dbPath = path.join(config.dataDir, 'database.sqlite');
export const db = new sqlite3.Database(dbPath);

db.run('PRAGMA journal_mode = WAL');
db.run('PRAGMA foreign_keys = ON');

export function dbGet<T = any>(sql: string, params: any[] = []): Promise<T | undefined> {
  return new Promise((resolve, reject) => {
    db.get(sql, params, (err: any, row: any) => (err ? reject(err) : resolve(row as T)));
  });
}

export function dbAll<T = any>(sql: string, params: any[] = []): Promise<T[]> {
  return new Promise((resolve, reject) => {
    db.all(sql, params, (err: any, rows: any) => (err ? reject(err) : resolve(rows as T[])));
  });
}

export function dbRun(sql: string, params: any[] = []): Promise<void> {
  return new Promise((resolve, reject) => {
    db.run(sql, params, (err: any) => (err ? reject(err) : resolve()));
  });
}

export function initDb(): void {
  db.serialize(() => {
    db.run(`CREATE TABLE IF NOT EXISTS users (
      userId INTEGER PRIMARY KEY,
      lang TEXT DEFAULT 'ru',
      source TEXT,
      subscribed INTEGER DEFAULT 0,
      createdAt TEXT
    )`);

    db.run(`CREATE TABLE IF NOT EXISTS drafts (
      userId INTEGER PRIMARY KEY,
      data TEXT,
      updatedAt INTEGER
    )`);

    db.run(`CREATE TABLE IF NOT EXISTS leads (
      seq INTEGER PRIMARY KEY AUTOINCREMENT,
      at TEXT,
      encryptedData TEXT
    )`);

    db.run(`CREATE TABLE IF NOT EXISTS events (
      seq INTEGER PRIMARY KEY AUTOINCREMENT,
      type TEXT NOT NULL,
      payload TEXT NOT NULL,
      isAcked INTEGER DEFAULT 0,
      createdAt TEXT
    )`);

    db.run(`CREATE TABLE IF NOT EXISTS notify_log (
      key TEXT PRIMARY KEY,
      result TEXT NOT NULL,
      createdAt TEXT
    )`);

    db.run(`CREATE TABLE IF NOT EXISTS stats (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      eventType TEXT,
      screenName TEXT,
      source TEXT,
      createdAt TEXT
    )`);

    db.run(`CREATE TABLE IF NOT EXISTS brief_state (
      userId INTEGER PRIMARY KEY,
      state TEXT NOT NULL,
      updatedAt TEXT NOT NULL
    )`);
  });
  console.log('[INFO] Database initialized');
}