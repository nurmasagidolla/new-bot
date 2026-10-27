import { readFileSync } from 'fs';
import { join } from 'path';
import type { Lang } from './types';

let cache: Record<string, string> | null = null;

function loadCards(): Record<string, string> {
  if (cache) return cache;
  try {
    const path = join(__dirname, 'cards.json');
    cache = JSON.parse(readFileSync(path, 'utf-8'));
    return cache!;
  } catch {
    cache = {};
    return cache;
  }
}

export function getCardFileId(lang: Lang, screenId: string): string | undefined {
  const cards = loadCards();
  return cards[`${screenId}.${lang}`];
}