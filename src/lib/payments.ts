// Payment utilities — Stripe Checkout + Telegram Stars
const SUPABASE_FUNCTIONS_URL = import.meta.env.VITE_SUPABASE_URL
  ? `${import.meta.env.VITE_SUPABASE_URL}/functions/v1`
  : null;

export interface Plan {
  id: 'free' | 'basic' | 'premium' | 'boost';
  label: string;
  description: string;
  price_eur: number;
  price_ron: number;
  stars: number;
  promotion_level: 'free' | 'basic' | 'premium';
  promotion_days: number | null;
  features: string[];
  badge?: string;
}

export const PLANS: Plan[] = [
  {
    id: 'free',
    label: 'Безкоштовно',
    description: 'Стандартна модерація',
    price_eur: 0,
    price_ron: 0,
    stars: 0,
    promotion_level: 'free',
    promotion_days: null,
    features: ['Розміщення в загальному списку', 'Черга стандартної модерації'],
  },
  {
    id: 'basic',
    label: 'Стандарт',
    description: 'Пріоритетна модерація',
    price_eur: 5,
    price_ron: 25,
    stars: 50,
    promotion_level: 'basic',
    promotion_days: 30,
    badge: '✓ Перевірено',
    features: [
      'Значок «Перевірено»',
      'Пріоритетна черга модерації',
      'Виділення у списку категорії',
      'Активне 30 днів',
    ],
  },
  {
    id: 'premium',
    label: 'Преміум',
    description: 'Топ позиція 30 днів',
    price_eur: 10,
    price_ron: 50,
    stars: 100,
    promotion_level: 'premium',
    promotion_days: 30,
    badge: '★ Топ',
    features: [
      'Топ позиція в категорії',
      'Блок «Рекомендовані» на головній',
      'Значок «Топ»',
      'Пріоритетна черга модерації',
      'Активне 30 днів',
    ],
  },
];

export async function createStripeCheckout(
  listingId: string,
  userId: string,
  planId: string,
  currency: 'EUR' | 'RON',
  successUrl: string,
  cancelUrl: string,
): Promise<{ url: string } | null> {
  if (!SUPABASE_FUNCTIONS_URL) return null;

  try {
    const res = await fetch(`${SUPABASE_FUNCTIONS_URL}/create-checkout-session`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        listing_id: listingId,
        user_id: userId,
        plan: planId,
        currency,
        success_url: successUrl,
        cancel_url: cancelUrl,
      }),
    });
    if (!res.ok) return null;
    return res.json();
  } catch {
    return null;
  }
}

export async function createStarsInvoice(
  listingId: string,
  userId: string,
  planId: string,
): Promise<{ invoice_link: string } | null> {
  if (!SUPABASE_FUNCTIONS_URL) return null;

  try {
    const res = await fetch(`${SUPABASE_FUNCTIONS_URL}/create-stars-invoice`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ listing_id: listingId, user_id: userId, plan: planId }),
    });
    if (!res.ok) return null;
    return res.json();
  } catch {
    return null;
  }
}
