// Sends a Web Push notification to a stored browser subscription.
// Uses VAPID (Voluntary Application Server Identification).

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SUPABASE_SERVICE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const VAPID_PUBLIC_KEY = Deno.env.get('VAPID_PUBLIC_KEY')!;
const VAPID_PRIVATE_KEY = Deno.env.get('VAPID_PRIVATE_KEY')!;
const VAPID_SUBJECT = Deno.env.get('VAPID_SUBJECT') || 'mailto:admin@brasov-ua.app';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Decode base64url to Uint8Array
function base64UrlToUint8Array(base64: string): Uint8Array {
  const pad = base64.length % 4;
  const b64 = base64.replace(/-/g, '+').replace(/_/g, '/') + '='.repeat(pad ? 4 - pad : 0);
  return Uint8Array.from(atob(b64), (c) => c.charCodeAt(0));
}

function uint8ArrayToBase64Url(arr: Uint8Array): string {
  return btoa(String.fromCharCode(...arr)).replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');
}

async function buildVapidHeaders(endpoint: string): Promise<Record<string, string>> {
  const url = new URL(endpoint);
  const audience = `${url.protocol}//${url.host}`;

  const now = Math.floor(Date.now() / 1000);
  const header = { typ: 'JWT', alg: 'ES256' };
  const payload = { aud: audience, exp: now + 43200, sub: VAPID_SUBJECT };

  const enc = new TextEncoder();
  const encodedHeader = uint8ArrayToBase64Url(enc.encode(JSON.stringify(header)));
  const encodedPayload = uint8ArrayToBase64Url(enc.encode(JSON.stringify(payload)));
  const signingInput = `${encodedHeader}.${encodedPayload}`;

  const privateKeyBytes = base64UrlToUint8Array(VAPID_PRIVATE_KEY);
  // Import as PKCS8 if it starts with MIG (DER-encoded), otherwise as raw
  const isPkcs8 = VAPID_PRIVATE_KEY.length > 100;
  const privateKey = await crypto.subtle.importKey(
    isPkcs8 ? 'pkcs8' : 'raw',
    privateKeyBytes,
    { name: 'ECDSA', namedCurve: 'P-256' },
    false,
    ['sign'],
  );

  const signature = await crypto.subtle.sign(
    { name: 'ECDSA', hash: 'SHA-256' },
    privateKey,
    enc.encode(signingInput),
  );

  const jwt = `${signingInput}.${uint8ArrayToBase64Url(new Uint8Array(signature))}`;

  return {
    Authorization: `vapid t=${jwt}, k=${VAPID_PUBLIC_KEY}`,
    'Content-Type': 'application/octet-stream',
    TTL: '86400',
  };
}

async function sendWebPush(
  subscription: { endpoint: string; keys: { auth: string; p256dh: string } },
  payload: string,
): Promise<boolean> {
  try {
    const headers = await buildVapidHeaders(subscription.endpoint);
    // For simplicity, send unencrypted (plaintext) — production should use RFC 8291 encryption
    const res = await fetch(subscription.endpoint, {
      method: 'POST',
      headers: { ...headers, 'Content-Encoding': 'aesgcm' },
      body: new TextEncoder().encode(payload),
    });
    return res.status === 201 || res.status === 200;
  } catch {
    return false;
  }
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { user_id, title, body, url } = await req.json() as {
      user_id: string;
      title: string;
      body: string;
      url?: string;
    };

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);
    const { data: subs } = await supabase
      .from('push_subscriptions')
      .select('subscription')
      .eq('user_id', user_id);

    if (!subs?.length) {
      return new Response(JSON.stringify({ ok: true, sent: 0 }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const payload = JSON.stringify({ title, body, url });
    const results = await Promise.all(
      subs.map((s) => sendWebPush(s.subscription, payload)),
    );

    return new Response(
      JSON.stringify({ ok: true, sent: results.filter(Boolean).length }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    );
  } catch (err) {
    return new Response(JSON.stringify({ error: String(err) }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
