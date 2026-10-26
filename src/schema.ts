import sqlite3 from 'sqlite3';
import path from 'path';
import fs from 'fs';
import { config } from './config';

if (!fs.existsSync(config.dataDir)) {
  fs.mkdirSync(config.dataDir, { recursive: true });
}

const dbPath = path.join(config.dataDir, 'database.sqlite');
export const db = new sqlite3.Database(dbPath);

export function initDb() {
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
      type TEXT,
      payload TEXT
    )`);
  });
}