import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SUPABASE_SERVICE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const BOT_TOKEN = Deno.env.get('TELEGRAM_BOT_TOKEN')!;
const ADMIN_IDS = (Deno.env.get('TELEGRAM_ADMIN_IDS') || '')
  .split(',')
  .map((s) => s.trim())
  .filter(Boolean)
  .map(Number);

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Validates Telegram Web App initData using HMAC-SHA256.
// Docs: https://core.telegram.org/bots/webapps#validating-data-received-via-the-mini-app
async function validateInitData(
  initData: string,
): Promise<Record<string, string> | null> {
  const params = new URLSearchParams(initData);
  const receivedHash = params.get('hash');
  if (!receivedHash) return null;

  params.delete('hash');

  const checkString = [...params.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([k, v]) => `${k}=${v}`)
    .join('\n');

  const enc = new TextEncoder();

  // Step 1: secret = HMAC-SHA256("WebAppData", BOT_TOKEN)
  const webAppDataKey = await crypto.subtle.importKey(
    'raw',
    enc.encode('WebAppData'),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign'],
  );
  const secretBytes = await crypto.subtle.sign('HMAC', webAppDataKey, enc.encode(BOT_TOKEN));

  // Step 2: expectedHash = HMAC-SHA256(secret, checkString)
  const secretKey = await crypto.subtle.importKey(
    'raw',
    secretBytes,
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign'],
  );
  const expectedBytes = await crypto.subtle.sign('HMAC', secretKey, enc.encode(checkString));
  const expectedHash = Array.from(new Uint8Array(expectedBytes))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');

  if (expectedHash !== receivedHash) return null;

  // Check auth_date is not older than 1 hour
  const authDate = Number(params.get('auth_date') || 0);
  if (Date.now() / 1000 - authDate > 3600) return null;

  return Object.fromEntries(params.entries());
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { initData } = await req.json();
    if (!initData) {
      return new Response(JSON.stringify({ error: 'initData required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const validated = await validateInitData(initData);
    if (!validated) {
      return new Response(JSON.stringify({ error: 'Invalid initData signature' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Parse user object from initData
    const user = JSON.parse(validated.user || '{}') as {
      id: number;
      first_name: string;
      last_name?: string;
      username?: string;
      language_code?: string;
    };

    if (!user.id) {
      return new Response(JSON.stringify({ error: 'No user in initData' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);
    const profileId = `tg-${user.id}`;
    const isAdmin = ADMIN_IDS.includes(user.id);

    // Upsert profile — preserve existing status/role on conflict
    const { data: profile, error } = await supabase
      .from('profiles')
      .upsert(
        {
          id: profileId,
          telegram_id: user.id,
          username: user.username || null,
          first_name: user.first_name,
          role: isAdmin ? 'admin' : 'user',
          status: isAdmin ? 'approved' : 'pending',
        },
        {
          onConflict: 'id',
          ignoreDuplicates: false,
        },
      )
      .select()
      .single();

    if (error) {
      // If conflict, fetch existing profile
      const { data: existing } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', profileId)
        .single();

      return new Response(JSON.stringify({ profile: existing }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    return new Response(JSON.stringify({ profile }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: String(err) }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
