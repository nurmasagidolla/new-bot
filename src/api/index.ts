import http from 'http';
import type { Bot } from 'grammy';
import { logger } from '../logger';
import { dbAll, getEvents, ackEvents } from '../db-queries';
import { isAuthorized, readBody, sendJson } from './auth';
import { handleNotify } from './notify';

export function createPanelServer(bot: Bot): http.Server {
  return http.createServer(async (req, res) => {
    const url = new URL(req.url || '/', `http://${req.headers.host ?? 'localhost'}`);

    if (url.pathname === '/health') {
      sendJson(res, 200, { ok: true });
      return;
    }

    if (!isAuthorized(req.headers['authorization'])) {
      sendJson(res, 401, { error: 'Unauthorized' });
      return;
    }

    try {
      if (req.method === 'GET' && url.pathname === '/leads') {
        const after = parseInt(url.searchParams.get('after') || '0', 10) || 0;
        const limit = Math.min(parseInt(url.searchParams.get('limit') || '100', 10) || 100, 100);
        const rows = await dbAll<any>(
          `SELECT seq, at, encryptedData FROM leads WHERE seq > ? ORDER BY seq ASC LIMIT ?`,
          [after, limit],
        );
        const lastSeq = rows.length ? rows[rows.length - 1].seq : after;
        sendJson(res, 200, {
          leads: rows.map((r) => ({ seq: r.seq, at: r.at, age: r.encryptedData })),
          next: lastSeq,
          last: lastSeq,
        });
        return;
      }

      if (req.method === 'GET' && url.pathname === '/events') {
        const after = parseInt(url.searchParams.get('after') || '0', 10) || 0;
        const limit = Math.min(parseInt(url.searchParams.get('limit') || '100', 10) || 100, 100);
        const events = await getEvents(after, limit);
        const lastSeq = events.length ? events[events.length - 1].seq : after;
        sendJson(res, 200, {
          events: events.map((e) => ({ seq: e.seq, ...JSON.parse(e.payload) })),
          next: lastSeq,
          last: lastSeq,
        });
        return;
      }

      if (req.method === 'POST' && url.pathname === '/events/ack') {
        let upTo: number;
        try {
          const body = await readBody(req);
          upTo = Number(JSON.parse(body).upTo);
          if (!Number.isFinite(upTo)) throw new Error('upTo must be a number');
        } catch {
          sendJson(res, 400, { error: 'Bad Request' });
          return;
        }
        await ackEvents(upTo);
        sendJson(res, 200, { ok: true });
        return;
      }

      if (req.method === 'POST' && url.pathname === '/notify') {
        await handleNotify(bot, req, res);
        return;
      }

      sendJson(res, 404, { error: 'Not Found' });
    } catch (e) {
      logger.error('API error', e);
      sendJson(res, 500, { error: 'Internal Server Error' });
    }
  });
}