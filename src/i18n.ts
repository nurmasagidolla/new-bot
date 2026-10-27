import type { Lang } from './types';
import { dbGet } from './db-queries';
import ru from './locales/ru';
import en from './locales/en';

const dictionaries: Record<Lang, any> = { ru, en };

export function getTranslation(lang: Lang, key: string, params?: Record<string, string>): string {
  const dict = dictionaries[lang] ?? dictionaries.en;
  const parts = key.split('.');
  let value: any = dict;
  for (const part of parts) {
    value = value?.[part];
    if (value === undefined) return key;
  }
  if (typeof value !== 'string') return key;
  if (params) {
    for (const [k, v] of Object.entries(params)) {
      value = value.replace(new RegExp(`\\{${k}\\}`, 'g'), v);
    }
  }
  return value;
}

export async function getUserLang(userId: number): Promise<Lang> {
  const row = await dbGet<{ lang: string }>(`SELECT lang FROM users WHERE userId = ?`, [userId]);
  return (row?.lang as Lang) ?? 'en';
}