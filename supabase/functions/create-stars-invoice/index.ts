// Creates a Telegram Stars invoice link for listing promotion
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const BOT_TOKEN = Deno.env.get('TELEGRAM_BOT_TOKEN') || '';
const TELEGRAM_API = `https://api.telegram.org/bot${BOT_TOKEN}`;

const STARS_PRICES: Record<string, number> = { basic: 50, premium: 100, boost: 20 };

const PLAN_LABELS: Record<string, string> = {
  basic:   'Стандарт — розміщення оголошення',
  premium: 'Преміум — топ позиція 30 днів',
  boost:   'Підняти оголошення на 7 днів',
};

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: CORS });

  try {
    const { listing_id, user_id, plan } = await req.json();

    const stars = STARS_PRICES[plan];
    if (!stars) {
      return new Response(JSON.stringify({ error: 'Invalid plan' }), {
        status: 400,
        headers: { ...CORS, 'Content-Type': 'application/json' },
      });
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') || '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '',
    );

    const { data: payment } = await supabase
      .from('payments')
      .insert({ listing_id, user_id, plan, currency: 'XTR', amount: stars, provider: 'stars', status: 'pending' })
      .select('id')
      .single();

    const res = await fetch(`${TELEGRAM_API}/createInvoiceLink`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        title: PLAN_LABELS[plan],
        description: 'Брашов Українські — платформа для українців у Брашові',
        payload: JSON.stringify({ listing_id, plan, payment_id: payment?.id }),
        currency: 'XTR',
        prices: [{ label: PLAN_LABELS[plan], amount: stars }],
      }),
    });

    const data = await res.json();
    if (!data.ok) throw new Error(data.description);

    return new Response(JSON.stringify({ invoice_link: data.result }), {
      headers: { ...CORS, 'Content-Type': 'application/json' },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: String(err) }), {
      status: 500,
      headers: { ...CORS, 'Content-Type': 'application/json' },
    });
  }
});
