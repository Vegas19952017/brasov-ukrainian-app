// Sends a Telegram Bot message to a user (push notification via Telegram).
// Call this from: listing approved/rejected, new review, new chat message.

const BOT_TOKEN = Deno.env.get('TELEGRAM_BOT_TOKEN')!;

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface NotifyPayload {
  telegram_id: number;
  text: string;         // HTML-formatted message
  url?: string;         // optional inline button URL
  button_text?: string; // optional inline button label
}

async function sendMessage(payload: NotifyPayload): Promise<boolean> {
  const body: Record<string, unknown> = {
    chat_id: payload.telegram_id,
    text: payload.text,
    parse_mode: 'HTML',
  };

  if (payload.url && payload.button_text) {
    body.reply_markup = {
      inline_keyboard: [[{ text: payload.button_text, web_app: { url: payload.url } }]],
    };
  }

  const res = await fetch(
    `https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    },
  );
  const json = await res.json();
  return json.ok === true;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const payload = await req.json() as NotifyPayload | NotifyPayload[];
    const payloads = Array.isArray(payload) ? payload : [payload];

    const results = await Promise.all(payloads.map(sendMessage));
    const allOk = results.every(Boolean);

    return new Response(
      JSON.stringify({ ok: allOk, sent: results.filter(Boolean).length, total: results.length }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    );
  } catch (err) {
    return new Response(JSON.stringify({ error: String(err) }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
