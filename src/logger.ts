export const logger = {
  info: (msg: string, meta?: any) => {
    console.log(JSON.stringify({ level: 'INFO', time: new Date().toISOString(), msg, ...meta }));
  },
  error: (msg: string, err?: any) => {
    console.error(JSON.stringify({ level: 'ERROR', time: new Date().toISOString(), msg, error: err?.message || err }));
  }
};