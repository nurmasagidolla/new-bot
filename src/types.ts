export type Lang = 'ru' | 'en';

export interface UserSession {
  userId: number;
  lang: Lang;
  source: string | null;
  subscribed: number;
  createdAt: string;
}