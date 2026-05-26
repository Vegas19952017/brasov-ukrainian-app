import { useLocation, useNavigate } from 'react-router-dom';
import { Home, MapPin, PlusCircle, User, Shield, MessageCircle } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useStore } from '../store';
import { cn } from '../lib/utils';

export default function BottomNav() {
  const { t } = useTranslation();
  const location = useLocation();
  const navigate = useNavigate();
  const { profile, unreadNotificationCount } = useStore();
  const unread = unreadNotificationCount();
  const isAdmin = profile?.role === 'admin';

  const tabs = [
    { path: '/', icon: Home, label: t('nav.home') },
    { path: '/map', icon: MapPin, label: t('nav.map') },
    { path: '/chat', icon: MessageCircle, label: t('nav.chat'), badge: unread },
    { path: '/add', icon: PlusCircle, label: t('nav.add'), accent: true },
    { path: '/cabinet', icon: User, label: t('nav.cabinet') },
    ...(isAdmin ? [{ path: '/admin', icon: Shield, label: t('nav.admin') }] : []),
  ];

  return (
    <nav className="ui-nav-dock fixed bottom-0 left-0 right-0 z-50">
      <div className="flex items-end justify-around px-1 pt-2 pb-1">
        {tabs.map((tab) => {
          const isActive = location.pathname === tab.path;
          const Icon = tab.icon;
          const isFab = tab.accent;
          return (
            <button
              key={tab.path}
              type="button"
              onClick={() => navigate(tab.path)}
              className={cn(
                'ui-nav-item',
                isActive && 'ui-nav-item--active',
                isFab && 'ui-nav-fab',
                isFab && isActive && 'ui-nav-item--accent'
              )}
            >
              <div className="ui-nav-item__icon">
                <Icon
                  size={isFab ? 24 : 20}
                  strokeWidth={2}
                  className={cn(
                    isFab ? 'text-obsidian' : isActive ? 'text-royal-light' : 'text-white/45'
                  )}
                />
                {'badge' in tab && (tab.badge ?? 0) > 0 && (
                  <span className="absolute -top-1 -right-1 min-w-[16px] h-4 px-1 rounded-md bg-crimson text-[9px] font-bold text-white flex items-center justify-center border border-crimson-light/30 shadow-red-glow">
                    {(tab.badge ?? 0) > 9 ? '9+' : tab.badge}
                  </span>
                )}
              </div>
              <span
                className={cn(
                  'text-[10px] font-semibold tracking-wide',
                  isActive && !isFab && 'text-royal-light',
                  isFab && 'text-amber',
                  !isActive && !isFab && 'text-white/35'
                )}
              >
                {tab.label}
              </span>
            </button>
          );
        })}
      </div>
      <div className="h-[env(safe-area-inset-bottom)]" />
    </nav>
  );
}
