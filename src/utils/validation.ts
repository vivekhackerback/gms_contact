/**
 * Mobile number normalization and validation for Indian mobile numbers
 */
export function normalizeIndianMobile(phone: string | null | undefined): string {
  if (!phone) return '';
  let cleaned = String(phone).replace(/[^0-9+]/g, '');
  if (cleaned.startsWith('+91')) {
    cleaned = cleaned.substring(3);
  } else if (cleaned.startsWith('91') && cleaned.length > 10) {
    cleaned = cleaned.substring(2);
  }
  return cleaned;
}

export function isValidIndianMobile(phone: string | null | undefined): boolean {
  if (!phone) return false;
  const normalized = normalizeIndianMobile(phone);
  // Valid Indian mobile: starts with 6, 7, 8, 9 and has exactly 10 digits
  return /^[6-9]\d{9}$/.test(normalized);
}

export function formatIndianMobile(phone: string | null | undefined): string {
  const norm = normalizeIndianMobile(phone);
  if (norm.length === 10) {
    return `+91 ${norm.slice(0, 5)} ${norm.slice(5)}`;
  }
  return phone || '';
}

export function isValidEmail(email: string | null | undefined): boolean {
  if (!email || email.trim() === '') return true; // optional
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
}
