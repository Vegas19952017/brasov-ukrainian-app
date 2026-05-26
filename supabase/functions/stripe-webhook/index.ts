// Stripe webhook — confirms payment and upgrades listing promotion level
import Stripe from 'https://esm.sh/stripe@14?target=deno';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY') || '', {
  apiVersion: '2024-04-10',
  httpClient: Stripe.createFetchHttpClient(),
});

const PROMOTION_DAYS: Record<string, number> = { basic: 30, premium: 30, boost: 7 };

Deno.serve(async (req) => {
  const body = await req.text();
  const sig = req.headers.get('stripe-signature') || '';
  const webhookSecret = Deno.env.get('STRIPE_WEBHOOK_SECRET') || '';

  let event: Stripe.Event;
  try {
    event = await stripe.webhooks.constructEventAsync(body, sig, webhookSecret);
  } catch (err) {
    return new Response(`Webhook Error: ${err}`, { status: 400 });
  }

  if (event.type === 'checkout.session.completed') {
    const session = event.data.object as Stripe.Checkout.Session;
    const { listing_id, plan, payment_id } = session.metadata || {};

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') || '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '',
    );

    const promotionUntil = new Date();
    promotionUntil.setDate(promotionUntil.getDate() + (PROMOTION_DAYS[plan] ?? 30));

    await Promise.all([
      supabase.from('payments').update({
        status: 'paid',
        stripe_payment_intent: session.payment_intent as string,
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

  return new Response(JSON.stringify({ received: true }), {
    headers: { 'Content-Type': 'application/json' },
  });
});
