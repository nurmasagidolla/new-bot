import { describe, it, expect } from 'vitest';
import { encryptLead } from '../src/encryption';
import * as age from 'age-encryption';

const TEST_RECIPIENT = 'age1gkes9de5c6vjndr8kmmvzceutdx2wecrvmh6mecwa0k0jamzhe0qq9yp5l'; // ← PUBLIC из генерации
const TEST_SECRET = 'AGE-SECRET-KEY-1ZWGNMNYWDLXN36M3ZCLZP899CELRHY0L3WXQHTHVYZ045PYQ0A8SQCJCDR'; // ← SECRET из генерации

describe('age-шифрование', () => {
  it('шифрует и расшифровывает обратно', async () => {
    const payload = { id: 'test-1', message: 'hello', budget: '50k' };

    const encrypted = await encryptLead(payload, TEST_RECIPIENT);
    expect(typeof encrypted).toBe('string');
    expect(encrypted.length).toBeGreaterThan(100);
    expect(encrypted.startsWith('YWdlLWVuY3J5cHRpb24u')).toBe(true);

    const decrypter = new age.Decrypter();
    decrypter.addIdentity(TEST_SECRET);

    const decrypted = await decrypter.decrypt(Buffer.from(encrypted, 'base64'));
    const json = new TextDecoder().decode(decrypted);
    const parsed = JSON.parse(json);

    expect(parsed).toEqual(payload);
  });

  it('кидает ошибку при невалидном recipient', async () => {
    await expect(encryptLead({ test: true }, 'not_age1')).rejects.toThrow(
      'LEADS_AGE_RECIPIENT is not configured or invalid',
    );
  });
});