import { Encrypter } from 'age-encryption';

/**
 * Шифрует строку (JSON заявки) на публичный ключ age1...
 * Возвращает base64-строку с зашифрованными данными.
 * Бот не может расшифровать — только панель с приватным ключом.
 */
export async function encryptLead(payload: object, recipient: string): Promise<string> {
  if (!recipient || !recipient.startsWith('age1')) {
    throw new Error('LEADS_AGE_RECIPIENT is not configured or invalid (должен начинаться с "age1")');
  }

  const encrypter = new Encrypter();
  encrypter.addRecipient(recipient);

  const json = JSON.stringify(payload);
  const encrypted = await encrypter.encrypt(new TextEncoder().encode(json));

  // В БД храним как base64-строку, чтобы читалось через API
  return Buffer.from(encrypted).toString('base64');
}