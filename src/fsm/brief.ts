import { dbGet, dbRun } from '../db-queries';

export type BriefStep =
  | 'consent' | 'service' | 'industry' | 'budget'
  | 'message' | 'name' | 'contact' | 'review' | 'done';

export interface BriefState {
  step: BriefStep;
  service?: string;
  industry?: string;
  budget?: string;
  message?: string;
  name?: string;
  contact?: { type: 'telegram' | 'phone' | 'email'; value: string };
  consentAt?: string;
  consentVersion?: string;
  source?: string;
  editing?: boolean;   // ← ДОБАВЬ ЭТУ СТРОКУ
}

export async function getBrief(userId: number): Promise<BriefState | null> {
  const row = await dbGet<{ state: string }>(`SELECT state FROM brief_state WHERE userId = ?`, [userId]);
  if (!row) return null;
  try { return JSON.parse(row.state) as BriefState; } catch { return null; }
}

export async function saveBrief(userId: number, state: BriefState): Promise<void> {
  await dbRun(
    `INSERT OR REPLACE INTO brief_state (userId, state, updatedAt) VALUES (?, ?, ?)`,
    [userId, JSON.stringify(state), new Date().toISOString()],
  );
}

export async function clearBrief(userId: number): Promise<void> {
  await dbRun(`DELETE FROM brief_state WHERE userId = ?`, [userId]);
}