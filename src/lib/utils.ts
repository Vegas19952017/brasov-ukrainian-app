import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatPrice(price: number | null, currency: string | null): string {
  if (price === null || price === undefined) return '';
  const symbol = currency === 'EUR' ? '€' : currency === 'UAH' ? '₴' : 'lei';
  return `${price.toLocaleString()} ${symbol}`;
}

export function getLocalizedName(
  item: { name_uk: string; name_ro: string; name_en: string },
  lang: string
): string {
  switch (lang) {
    case 'ro': return item.name_ro;
    case 'en': return item.name_en;
    default: return item.name_uk;
  }
}

export function getLocalizedReason(
  item: { reason_uk: string; reason_ro: string; reason_en: string },
  lang: string
): string {
  switch (lang) {
    case 'ro': return item.reason_ro;
    case 'en': return item.reason_en;
    default: return item.reason_uk;
  }
}

export function timeAgo(dateStr: string, lang: string = 'uk'): string {
  const now = new Date();
  const date = new Date(dateStr);
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);

  const labels: Record<string, { min: string; hour: string; day: string; ago: string }> = {
    uk: { min: 'хв', hour: 'год', day: 'дн', ago: 'тому' },
    ro: { min: 'min', hour: 'ore', day: 'zile', ago: 'în urmă' },
    en: { min: 'min', hour: 'hr', day: 'days', ago: 'ago' },
  };
  const l = labels[lang] || labels.uk;

  if (diffMins < 1) return lang === 'uk' ? 'щойно' : lang === 'ro' ? 'acum' : 'just now';
  if (diffMins < 60) return `${diffMins} ${l.min} ${l.ago}`;
  if (diffHours < 24) return `${diffHours} ${l.hour} ${l.ago}`;
  if (diffDays < 30) return `${diffDays} ${l.day} ${l.ago}`;
  return date.toLocaleDateString();
}

export function truncate(str: string, len: number): string {
  if (str.length <= len) return str;
  return str.slice(0, len) + '…';
}

// Brasov map center coordinates
export const BRASOV_CENTER: [number, number] = [45.6427, 25.5887];
export const BRASOV_ZOOM = 13;
