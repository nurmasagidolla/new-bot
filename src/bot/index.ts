import { Bot } from 'grammy';
import dns from 'dns';
import net from 'net';
import { ProxyAgent } from 'undici';
import { config } from '../config';
import { installRateLimit } from './middleware';
import { installCommands } from './commands';
import { installMenus } from './menus';
import { installBrief } from '../brief';
import { installFallbacks } from './fallbacks';

export function createBot(): Bot {
  dns.setDefaultResultOrder('ipv4first');
  net.setDefaultAutoSelectFamily(false);

  const proxyUrl = process.env.TELEGRAM_PROXY;
  const bot = new Bot(
    config.botToken,
    proxyUrl
      ? { client: { baseFetchConfig: { dispatcher: new ProxyAgent(proxyUrl) } as any } }
      : undefined,
  );

  installRateLimit(bot);
  installCommands(bot);
  installMenus(bot);
  installBrief(bot);
  installFallbacks(bot);

  return bot;
}