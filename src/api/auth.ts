import type http from 'http';
import { timingSafeEqual } from 'crypto';
import { config } from '../config';

export function isAuthorized(header: string | undefined): boolean {
  const expected = Buffer.from(`Bearer ${config.panelApiToken}`);
  const got = Buffer.from(header ?? '');
  return got.length === expected.length && timingSafeEqual(got, expected);
}

export function readBody(req: http.IncomingMessage, limit = 10_000): Promise<string> {
  return new Promise((resolve, reject) => {
    let body = '';
    req.on('data', (chunk) => {
      body += chunk;
      if (body.length > limit) {
        reject(new Error('Body too large'));
        req.destroy();
      }
    });
    req.on('end', () => resolve(body));
    req.on('error', reject);
  });
}

export function sendJson(res: http.ServerResponse, status: number, data: unknown): void {
  res.writeHead(status, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify(data));
}