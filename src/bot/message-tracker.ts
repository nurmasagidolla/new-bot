const lastBotMessage = new Map<number, number>();
const lastUserMessage = new Map<number, number>();
const allBotMessages = new Map<number, number[]>();

export function setLastBotMessage(userId: number, messageId: number): void {
  lastBotMessage.set(userId, messageId);
  const arr = allBotMessages.get(userId) ?? [];
  arr.push(messageId);
  allBotMessages.set(userId, arr);
}

export function getLastBotMessage(userId: number): number | undefined {
  return lastBotMessage.get(userId);
}

export function getAllBotMessages(userId: number): number[] {
  return allBotMessages.get(userId) ?? [];
}

export function clearAllBotMessages(userId: number): void {
  allBotMessages.delete(userId);
}

export function setLastUserMessage(userId: number, messageId: number): void {
  lastUserMessage.set(userId, messageId);
}

export function getLastUserMessage(userId: number): number | undefined {
  return lastUserMessage.get(userId);
}

export function clearAllMessages(userId: number): void {
  lastBotMessage.delete(userId);
  lastUserMessage.delete(userId);
  allBotMessages.delete(userId);
}