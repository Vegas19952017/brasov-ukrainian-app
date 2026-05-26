// Checks if a Telegram user is a member of one or more groups/channels.
// The bot must be an administrator of each group.

const BOT_TOKEN = Deno.env.get('TELEGRAM_BOT_TOKEN')!;
// Comma-separated list of group usernames or chat_ids, e.g. "@brasov_ua,-1001234567890"
const REQUIRED_GROUPS = (Deno.env.get('TELEGRAM_REQUIRED_GROUPS') || '')
  .split(',')
  .map((s) => s.trim())
  .filter(Boolean);

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const MEMBER_STATUSES = new Set(['member', 'administrator', 'creator']);

async function checkGroup(chatId: string, userId: number): Promise<boolean> {
  try {
    const res = await fetch(
      `https://api.telegram.org/bot${BOT_TOKEN}/getChatMember`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ chat_id: chatId, user_id: userId }),
      },
    );
    const json = await res.json();
    return MEMBER_STATUSES.has(json.result?.status);
  } catch {
    return false;
  }
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { telegram_id, groups } = await req.json() as {
      telegram_id: number;
      groups?: string[];  // override env groups if provided
    };

    if (!telegram_id) {
      return new Response(JSON.stringify({ error: 'telegram_id required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const groupsToCheck = groups?.length ? groups : REQUIRED_GROUPS;

    if (!groupsToCheck.length) {
      // No groups configured — allow everyone
      return new Response(
        JSON.stringify({ isMember: true, groups: {}, requiredGroups: [] }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      );
    }

    // Check all groups in parallel
    const results = await Promise.all(
      groupsToCheck.map(async (g) => ({
        group: g,
        isMember: await checkGroup(g, telegram_id),
      })),
    );

    const groupMap: Record<string, boolean> = {};
    for (const r of results) groupMap[r.group] = r.isMember;

    // User must be member of AT LEAST ONE group to leave reviews
    const isMember = results.some((r) => r.isMember);

    return new Response(
      JSON.stringify({ isMember, groups: groupMap, requiredGroups: groupsToCheck }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    );
  } catch (err) {
    return new Response(JSON.stringify({ error: String(err) }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
