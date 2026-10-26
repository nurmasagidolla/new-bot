export function validateEmail(email: string): boolean {
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return re.test(email);
}

export function sanitizeText(text: string): string {
  let clean = text.replace(/—/g, '–');
  return clean.replace(/</g, '&lt;').replace(/>/g, '&gt;');
}