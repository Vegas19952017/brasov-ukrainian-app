import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Bell, CheckCircle, XCircle, MessageCircle, Star, UserCheck, MessageSquare
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useStore } from '../store';
import { getLocalizedNotification } from '../lib/notifications';
import { cn, timeAgo } from '../lib/utils';
import type { NotificationType } from '../types';

// Icon + color config per notification type
const TYPE_CONFIG: Record<NotificationType, { icon: typeof Bell; color: string; bg: string }> = {
  listing_approved:  { icon: CheckCircle,   color: 'text-emerald-400', bg: 'bg-emerald-500/10' },
  listing_rejected:  { icon: XCircle,       color: 'text-crimson-light', bg: 'bg-crimson/10' },
  profile_approved:  { icon: UserCheck,     color: 'text-royal-light',  bg: 'bg-royal/10' },
  profile_rejected:  { icon: XCircle,       color: 'text-crimson-light', bg: 'bg-crimson/10' },
  chat_message:      { icon: MessageCircle, color: 'text-white/60',     bg: 'bg-white/5' },
  review_received:   { icon: Star,          color: 'text-amber',         bg: 'bg-amber/10' },
};

export default function NotificationBell() {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const {
    profile,
    notifications,
    unreadNotificationCount,
    markNotificationRead,
    markAllNotificationsRead,
  } = useStore();

  const unread = unreadNotificationCount();
  const mine = notifications
    .filter((n) => n.user_id === profile?.id)
    .slice(0, 30);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  if (!profile) return null;

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        aria-label={t('notifications.title')}
        className={cn('ui-btn-icon relative w-9 h-9', open && 'border-royal/40')}
      >
        <Bell size={18} className="text-white/60" />
        {unread > 0 && (
          <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 rounded-full bg-crimson text-[10px] font-bold text-white flex items-center justify-center animate-pulse">
            {unread > 9 ? '9+' : unread}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-2 w-[min(320px,calc(100vw-2rem))] glass-panel p-2 animate-fade-in z-[60] max-h-[70vh] overflow-y-auto shadow-2xl">
          {/* Header */}
          <div className="flex items-center justify-between px-2 py-1.5 mb-1 border-b border-glass-border pb-2">
            <span className="text-xs font-bold text-white/70 flex items-center gap-1.5">
              <Bell size={13} />
              {t('notifications.title')}
              {unread > 0 && (
                <span className="bg-crimson text-white text-[9px] font-black rounded-full px-1.5 py-0.5">{unread}</span>
              )}
            </span>
            {unread > 0 && (
              <button
                type="button"
                onClick={() => markAllNotificationsRead()}
                className="text-[10px] text-royal-light hover:underline"
              >
                {t('notifications.mark_all_read')}
              </button>
            )}
          </div>

          {mine.length === 0 ? (
            <div className="py-10 text-center space-y-2">
              <Bell size={24} className="text-white/10 mx-auto" />
              <p className="text-xs text-white/30">{t('notifications.empty')}</p>
            </div>
          ) : (
            <div className="space-y-0.5">
              {mine.map((n) => {
                const loc = getLocalizedNotification(n, i18n.language);
                const cfg = TYPE_CONFIG[n.type] ?? TYPE_CONFIG.chat_message;
                const Icon = cfg.icon;
                return (
                  <button
                    key={n.id}
                    type="button"
                    onClick={() => {
                      markNotificationRead(n.id);
                      if (n.link) navigate(n.link);
                      setOpen(false);
                    }}
                    className={cn(
                      'w-full text-left px-3 py-2.5 rounded-xl transition-colors flex gap-3 items-start',
                      n.read
                        ? 'hover:bg-white/5'
                        : cn('border border-transparent', cfg.bg, 'hover:opacity-90')
                    )}
                  >
                    {/* Type icon */}
                    <div className={cn(
                      'w-7 h-7 rounded-lg flex items-center justify-center shrink-0 mt-0.5',
                      n.read ? 'bg-white/5' : cfg.bg
                    )}>
                      <Icon size={14} className={n.read ? 'text-white/30' : cfg.color} />
                    </div>
                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <p className={cn(
                        'text-xs font-semibold leading-tight',
                        n.read ? 'text-white/50' : 'text-white'
                      )}>
                        {loc.title}
                      </p>
                      <p className="text-[11px] text-white/40 mt-0.5 line-clamp-2 leading-relaxed">
                        {loc.body}
                      </p>
                      <p className="text-[10px] text-white/20 mt-1">
                        {timeAgo(n.created_at, i18n.language)}
                      </p>
                    </div>
                    {/* Unread dot */}
                    {!n.read && (
                      <div className="w-2 h-2 rounded-full bg-royal-light shrink-0 mt-1.5" />
                    )}
                  </button>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
