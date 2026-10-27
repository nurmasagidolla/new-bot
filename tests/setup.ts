import { beforeAll } from 'vitest';
import { existsSync, rmSync, mkdirSync } from 'fs';
import { join } from 'path';

const testDataDir = join(process.cwd(), 'data-test');
if (existsSync(testDataDir)) rmSync(testDataDir, { recursive: true, force: true });
mkdirSync(testDataDir, { recursive: true });

process.env.DATA_DIR = testDataDir;
process.env.BOT_TOKEN = '123456789:TEST_TOKEN';
process.env.PANEL_API_TOKEN = 'test_token_at_least_32_characters_long_xx';
process.env.PANEL_API_PORT = '3456';
process.env.PANEL_API_HOST = '127.0.0.1';
process.env.LEADS_AGE_RECIPIENT = 'age1gkes9de5c6vjndr8kmmvzceutdx2wecrvmh6mecwa0k0jamzhe0qq9yp5l';  // ← PUBLIC из генерации
process.env.ADMIN_IDS = '999';

beforeAll(async () => {
  const { initDb } = await import('../src/schema');
  initDb();
  await new Promise((resolve) => setTimeout(resolve, 200));
});