import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

export const supabase = createClient(
  supabaseUrl || 'https://placeholder.supabase.co',
  supabaseAnonKey || 'placeholder-key'
);

export function isSupabaseConfigured(): boolean {
  return (
    Boolean(supabaseUrl) &&
    Boolean(supabaseAnonKey) &&
    !supabaseUrl.includes('your-project') &&
    !supabaseAnonKey.includes('your-anon') &&
    !supabaseUrl.includes('placeholder')
  );
}

export function getTelegramUser() {
  if (typeof window !== 'undefined' && window.Telegram?.WebApp) {
    const webapp = window.Telegram.WebApp;
    webapp.ready();
    webapp.expand();
    if (webapp.themeParams) {
      document.documentElement.style.setProperty(
        '--tg-bg',
        webapp.themeParams.bg_color || '#090a0f'
      );
      document.documentElement.style.setProperty(
        '--tg-text',
        webapp.themeParams.text_color || '#ffffff'
      );
      document.documentElement.style.setProperty(
        '--tg-button',
        webapp.themeParams.button_color || '#2563eb'
      );
    }
    return webapp.initDataUnsafe?.user || null;
  }
  return null;
}

export function getInitData(): string | null {
  if (typeof window !== 'undefined' && window.Telegram?.WebApp) {
    return window.Telegram.WebApp.initData || null;
  }
  return null;
}

declare global {
  interface Window {
    Telegram?: {
      WebApp: {
        ready: () => void;
        expand: () => void;
        close: () => void;
        initData: string;
        initDataUnsafe: {
          user?: {
            id: number;
            first_name: string;
            last_name?: string;
            username?: string;
            language_code?: string;
            is_premium?: boolean;
            photo_url?: string;
          };
          query_id?: string;
        };
        themeParams: {
          bg_color?: string;
          text_color?: string;
          hint_color?: string;
          link_color?: string;
          button_color?: string;
          button_text_color?: string;
          secondary_bg_color?: string;
        };
        MainButton: {
          text: string;
          show: () => void;
          hide: () => void;
          onClick: (cb: () => void) => void;
        };
        BackButton: {
          show: () => void;
          hide: () => void;
          onClick: (cb: () => void) => void;
        };
        HapticFeedback: {
          impactOccurred: (style: string) => void;
          notificationOccurred: (type: string) => void;
        };
        openLink: (url: string) => void;
        openInvoice: (url: string, callback: (status: string) => void) => void;
      };
    };
    __navigateToListing?: (id: string) => void;
  }
}
