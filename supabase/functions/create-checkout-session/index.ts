// Creates a Stripe Checkout session for listing promotion plans
import Stripe from 'https://esm.sh/stripe@14?target=deno';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY') || '', {
  apiVersion: '2024-04-10',
  httpClient: Stripe.createFetchHttpClient(),
});

const PRICE_MAP = {
  basic:   { EUR: 500,  RON: 2500 },
  premium: { EUR: 1000, RON: 5000 },
  boost:   { EUR: 200,  RON: 1000 },
} as const;

const PLAN_LABELS = {
  basic:   'Стандарт — розміщення оголошення',
  premium: 'Преміум — топ позиція 30 днів',
  boost:   'Підняти оголошення на 7 днів',
} as const;

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: CORS });

  try {
    const { listing_id, user_id, plan, currency, success_url, cancel_url } = await req.json();

    if (!PRICE_MAP[plan as keyof typeof PRICE_MAP]) {
      return new Response(JSON.stringify({ error: 'Invalid plan' }), {
        status: 400,
        headers: { ...CORS, 'Content-Type': 'application/json' },
      });
    }

    const amount = PRICE_MAP[plan as keyof typeof PRICE_MAP][currency as 'EUR' | 'RON'];

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') || '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '',
    );

    const { data: payment, error: dbErr } = await supabase
      .from('payments')
      .insert({ listing_id, user_id, plan, currency, amount, provider: 'stripe', status: 'pending' })
      .select('id')
      .single();

    if (dbErr) throw dbErr;

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [{
        price_data: {
          currency: currency.toLowerCase(),
          product_data: { name: PLAN_LABELS[plan as keyof typeof PLAN_LABELS] },
          unit_amount: amount,
        },
        quantity: 1,
      }],
      mode: 'payment',
      success_url: `${success_url}&payment_id=${payment.id}`,
      cancel_url,
      metadata: { listing_id, plan, payment_id: payment.id },
    });

    await supabase.from('payments').update({ stripe_session_id: session.id }).eq('id', payment.id);

    return new Response(JSON.stringify({ url: session.url }), {
      headers: { ...CORS, 'Content-Type': 'application/json' },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: String(err) }), {
      status: 500,
      headers: { ...CORS, 'Content-Type': 'application/json' },
    });
  }
});
