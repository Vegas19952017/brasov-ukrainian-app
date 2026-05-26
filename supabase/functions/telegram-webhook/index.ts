// Telegram Bot webhook — handles Stars pre_checkout_query and successful_payment
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const BOT_TOKEN = Deno.env.get('TELEGRAM_BOT_TOKEN') || '';
const TELEGRAM_API = `https://api.telegram.org/bot${BOT_TOKEN}`;
const PROMOTION_DAYS: Record<string, number> = { basic: 30, premium: 30, boost: 7 };

Deno.serve(async (req) => {
  const update = await req.json();

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL') || '',
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '',
  );

  // Must answer pre_checkout_query within 10 seconds
  if (update.pre_checkout_query) {
    await fetch(`${TELEGRAM_API}/answerPreCheckoutQuery`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ pre_checkout_query_id: update.pre_checkout_query.id, ok: true }),
    });
    return new Response('ok');
  }

  if (update.message?.successful_payment) {
    const sp = update.message.successful_payment;
    let payload: { listing_id: string; plan: string; payment_id: string };
    try {
      payload = JSON.parse(sp.invoice_payload);
    } catch {
      return new Response('ok');
    }

    const { listing_id, plan, payment_id } = payload;
    const promotionUntil = new Date();
    promotionUntil.setDate(promotionUntil.getDate() + (PROMOTION_DAYS[plan] ?? 30));

    await Promise.all([
      supabase.from('payments').update({
        status: 'paid',
        telegram_charge_id: sp.telegram_payment_charge_id,
        paid_at: new Date().toISOString(),
      }).eq('id', payment_id),

      supabase.from('listings').update({
        promotion_level: plan,
        promotion_until: promotionUntil.toISOString(),
        is_featured: plan === 'premium',
        status: 'approved',
      }).eq('id', listing_id),
    ]);
  }

  return new Response('ok');
});
