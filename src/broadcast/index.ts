export type BroadcastStep =
  | 'idle'
  | 'text'
  | 'buttons'
  | 'audience'
  | 'preview'
  | 'sending';

export interface BroadcastButton {
  text: string;
  url: string;
}

export interface BroadcastState {
  step: BroadcastStep;
  text?: string;
  buttons?: BroadcastButton[];
  audience?: 'ru' | 'en' | 'all';
}

const states = new Map<number, BroadcastState>();

export function getBroadcastState(adminId: number): BroadcastState | null {
  return states.get(adminId) ?? null;
}

export function setBroadcastState(adminId: number, state: BroadcastState): void {
  states.set(adminId, state);
}

export function clearBroadcastState(adminId: number): void {
  states.delete(adminId);
}

export function getAudienceLabel(lang: 'ru' | 'en', audience: 'ru' | 'en' | 'all'): string {
  if (audience === 'ru') return lang === 'ru' ? '🇷🇺 Только ru' : '🇷🇺 ru only';
  if (audience === 'en') return lang === 'ru' ? '🇬🇧 Только en' : '🇬🇧 en only';
  return lang === 'ru' ? '🌍 Все' : '🌍 All';
}