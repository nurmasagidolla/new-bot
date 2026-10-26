const userLastAction = new Map<number, number>();

export function checkRateLimit(userId: number): boolean {
  const now = Date.now();
  const last = userLastAction.get(userId) || 0;
  if (now - last < 500) {
    return false; // Ограничение: не более 2 действий в секунду
  }
  userLastAction.set(userId, now);
  return true;
}