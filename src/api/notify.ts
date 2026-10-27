import type http from 'http';
import type { Bot } from 'grammy';
import { sendNotify } from '../notify';
import type { NotifyTemplate, NotifyParams } from '../notify';
import { sendJson, readBody } from './auth';

interface NotifyBody {
  key: string;
  tgUserId: number;
  template: NotifyTemplate;
  params?: NotifyParams;
}

export async function handleNotify(
  bot: Bot,
  req: http.IncomingMessage,
  res: http.ServerResponse,
): Promise<void> {
  let body: NotifyBody;
  try {
    const raw = await readBody(req);
    body = JSON.parse(raw);
  } catch {
    sendJson(res, 400, { ok: false, error: 'bad_request' });
    return;
  }

  if (!body.key || !body.tgUserId || !body.template) {
    sendJson(res, 400, { ok: false, error: 'missing_fields' });
    return;
  }

  const result = await sendNotify(
    bot,
    body.key,
    body.tgUserId,
    body.template,
    body.params ?? {},
  );

  if (result.ok) {
    sendJson(res, 200, { ok: true, messageId: result.messageId });
  } else {
    sendJson(res, 200, { ok: false, error: result.error });
  }
}