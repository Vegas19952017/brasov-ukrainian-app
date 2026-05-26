// Web Push — service worker registration + subscription management
import { supabase, isSupabaseConfigured } from './supabase';

const VAPID_PUBLIC_KEY = import.meta.env.VITE_VAPID_PUBLIC_KEY as string | undefined;
const SW_PATH = '/brasov-ukrainian-app/sw.js';

function urlBase64ToUint8Array(base64: string): Uint8Array {
  const pad = base64.length % 4;
  const b64 = base64.replace(/-/g, '+').replace(/_/g, '/') + '='.repeat(pad ? 4 - pad : 0);
  const raw = atob(b64);
  return Uint8Array.from(raw, (c) => c.charCodeAt(0));
}

let swRegistration: ServiceWorkerRegistration | null = null;

export async function registerServiceWorker(): Promise<ServiceWorkerRegistration | null> {
  if (!('serviceWorker' in navigator)) return null;
  try {
    swRegistration = await navigator.serviceWorker.register(SW_PATH, { scope: '/brasov-ukrainian-app/' });
    await navigator.serviceWorker.ready;

    // Handle navigate messages from SW (notification click → in-app navigation)
    navigator.serviceWorker.addEventListener('message', (e) => {
      if (e.data?.type === 'navigate') {
        window.location.hash = e.data.url;
      }
    });

    return swRegistration;
  } catch {
    return null;
  }
}

export async function subscribeToPush(userId: string): Promise<boolean> {
  if (!VAPID_PUBLIC_KEY || !isSupabaseConfigured()) return false;

  try {
    const reg = swRegistration || (await registerServiceWorker());
    if (!reg) return false;

    const permission = await Notification.requestPermission();
    if (permission !== 'granted') return false;

    const existing = await reg.pushManager.getSubscription();
    const subscription =
      existing ||
      (await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY),
      }));

    // Persist subscription in Supabase for server-initiated pushes
    const { error } = await supabase.from('push_subscriptions').upsert({
      user_id: userId,
      subscription: subscription.toJSON(),
    });

    return !error;
  } catch {
    return false;
  }
}

export async function unsubscribeFromPush(userId: string): Promise<void> {
  try {
    const reg = swRegistration || (await navigator.serviceWorker.getRegistration(SW_PATH));
    if (reg) {
      const sub = await reg.pushManager.getSubscription();
      await sub?.unsubscribe();
    }
    if (isSupabaseConfigured()) {
      await supabase.from('push_subscriptions').delete().eq('user_id', userId);
    }
  } catch {
    // Non-critical
  }
}

export function isPushSupported(): boolean {
  return 'serviceWorker' in navigator && 'PushManager' in window && !!VAPID_PUBLIC_KEY;
}

export async function isPushSubscribed(): Promise<boolean> {
  try {
    const reg = await navigator.serviceWorker.getRegistration(SW_PATH);
    if (!reg) return false;
    const sub = await reg.pushManager.getSubscription();
    return !!sub;
  } catch {
    return false;
  }
}
