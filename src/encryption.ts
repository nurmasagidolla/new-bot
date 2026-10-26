import * as age from 'age-encryption';
import { config } from './config';
import { logger } from './logger';

export async function encryptLeadData(leadData: object): Promise<string> {
  try {
    if (!config.leadsAgeRecipient || !config.leadsAgeRecipient.startsWith('age1')) {
      throw new Error('Age recipient is missing or invalid');
    }

    const enc = new age.Encrypter();
    enc.addRecipient(config.leadsAgeRecipient);
    
    const jsonString = JSON.stringify(leadData);
    const encryptedBytes = await enc.encrypt(Buffer.from(jsonString, 'utf-8'));
    
    return Buffer.from(encryptedBytes).toString('base64');
  } catch (err) {
    logger.error('Failed to encrypt lead data', err);
    throw err;
  }
}