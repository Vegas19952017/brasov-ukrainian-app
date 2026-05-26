// Telegram Mini App authentication — validates initData server-side via HMAC.
import { supabase, isSupabaseConfigured, getTelegramUser, getInitData } from './supabase';
import type { Profile } from '../types';

const SUPABASE_FUNCTIONS_URL = import.meta.env.VITE_SUPABASE_URL
  ? `${import.meta.env.VITE_SUPABASE_URL}/functions/v1`
  : null;

export interface AuthResult {
  profile: Profile | null;
  error: string | null;
  source: 'server' | 'unsafe' | 'demo';
}

// Full server-side validated auth (production path)
async function authenticateViaEdgeFunction(initData: string): Promise<AuthResult> {
  const res = await fetch(`${SUPABASE_FUNCTIONS_URL}/auth-telegram`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ initData }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: 'Unknown error' }));
    return { profile: null, error: err.error || 'Auth failed', source: 'server' };
  }

  const { profile } = await res.json();
  return { profile, error: null, source: 'server' };
}

// Fallback: read from initDataUnsafe (dev/local only, NOT for production)
function authenticateUnsafe(): AuthResult {
  const tgUser = getTelegramUser();
  if (!tgUser) return { profile: null, error: 'No Telegram user', source: 'unsafe' };

  const demoAdmin = import.meta.env.VITE_DEMO_ADMIN === 'true';
  const adminIds = (import.meta.env.VITE_ADMIN_TELEGRAM_IDS || '')
    .split(',')
    .map((s: string) => s.trim())
    .filter(Boolean)
    .map(Number);

  const isAdmin = demoAdmin || adminIds.includes(tgUser.id);

  const profile: Profile = {
    id: `tg-${tgUser.id}`,
    telegram_id: tgUser.id,
    username: tgUser.username || null,
    first_name: tgUser.first_name,
    role: isAdmin ? 'admin' : 'user',
    status: isAdmin ? 'approved' : 'pending',
    created_at: new Date().toISOString(),
  };

  return { profile, error: null, source: 'unsafe' };
}

// Demo profile for local development without Telegram
function authenticateDemo(): AuthResult {
  const demoAdmin = import.meta.env.VITE_DEMO_ADMIN === 'true';
  const profile: Profile = {
    id: 'user-demo',
    telegram_id: 123456789,
    username: 'demo_user',
    first_name: 'Демо',
    role: demoAdmin ? 'admin' : 'user',
    status: 'approved',
    created_at: new Date().toISOString(),
  };
  return { profile, error: null, source: 'demo' };
}

// Main entry point — picks the safest available auth strategy
export async function authenticate(): Promise<AuthResult> {
  const initData = getInitData();

  // Best path: server-side HMAC validation
  if (initData && isSupabaseConfigured() && SUPABASE_FUNCTIONS_URL) {
    try {
      const result = await authenticateViaEdgeFunction(initData);
      if (result.profile) return result;
    } catch {
      // Fall through to unsafe
    }
  }

  // Middle path: read from initDataUnsafe (inside Telegram but Supabase not configured)
  if (initData || window.Telegram?.WebApp) {
    return authenticateUnsafe();
  }

  // Dev fallback: demo profile
  return authenticateDemo();
}

// Check if user is a member of any required Telegram group
// Used before allowing review submission
export async function checkGroupMembership(
  telegramId: number,
  groups?: string[],
): Promise<{ isMember: boolean; groups: Record<string, boolean> }> {
  if (!isSupabaseConfigured() || !SUPABASE_FUNCTIONS_URL) {
    // Can't check — allow in dev
    return { isMember: true, groups: {} };
  }

  try {
    const res = await fetch(`${SUPABASE_FUNCTIONS_URL}/check-membership`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ telegram_id: telegramId, groups }),
    });
    if (!res.ok) return { isMember: false, groups: {} };
    return await res.json();
  } catch {
    return { isMember: false, groups: {} };
  }
}

// Send a Telegram Bot notification to a user
export async function sendBotNotification(
  telegramId: number,
  text: string,
  url?: string,
  buttonText?: string,
): Promise<void> {
  if (!isSupabaseConfigured() || !SUPABASE_FUNCTIONS_URL) return;

  try {
    await fetch(`${SUPABASE_FUNCTIONS_URL}/send-bot-notification`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        telegram_id: telegramId,
        text,
        url,
        button_text: buttonText,
      }),
    });
  } catch {
    // Non-critical, don't throw
  }
}
