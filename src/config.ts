import dotenv from 'dotenv';
dotenv.config();

export const config = {
  botToken: process.env.BOT_TOKEN || '',
  adminIds: (process.env.ADMIN_IDS || '').split(',').map(id => parseInt(id.trim())).filter(Boolean),
  studioTelegram: process.env.STUDIO_TELEGRAM || 'cloutlab',
  siteUrl: process.env.SITE_URL || 'https://cloutlab.studio',
  leadsAgeRecipient: process.env.LEADS_AGE_RECIPIENT || '',
  panelApiHost: process.env.PANEL_API_HOST || '0.0.0.0',
  panelApiPort: parseInt(process.env.PANEL_API_PORT || '3000', 10),
  panelApiToken: process.env.PANEL_API_TOKEN || '',
  dataDir: process.env.DATA_DIR || './data',
};