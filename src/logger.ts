const levels = ['info', 'warn', 'error'] as const;
type Level = typeof levels[number];

function log(level: Level, msg: string, meta?: unknown) {
  const entry = {
    level: level.toUpperCase(),
    time: new Date().toISOString(),
    msg,
    ...(meta !== undefined ? { meta } : {}),
  };
  const line = JSON.stringify(entry);
  if (level === 'error') console.error(line);
  else if (level === 'warn') console.warn(line);
  else console.log(line);
}

export const logger = {
  info: (msg: string, meta?: unknown) => log('info', msg, meta),
  warn: (msg: string, meta?: unknown) => log('warn', msg, meta),
  error: (msg: string, err?: unknown) => log('error', msg, err),
};