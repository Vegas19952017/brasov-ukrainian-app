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
    { path: '/',       icon: Home,          label: t('nav.home') },
    { path: '/map',    icon: MapPin,         label: t('nav.map') },
    { path: '/chat',   icon: MessageCircle,  label: t('nav.chat'),  badge: unread },
    { path: '/add',    icon: PlusCircle,     label: t('nav.add'),   accent: true },
    { path: '/cabinet',icon: User,           label: t('nav.cabinet') },
    ...(isAdmin ? [{ path: '/admin', icon: Shield, label: t('nav.admin') }] : []),
  ];

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-50 border-t border-black/7"
      style={{ background: 'rgba(247,250,247,0.88)', backdropFilter: 'blur(20px)' }}
    >
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
                'flex flex-col items-center gap-1 py-1.5 px-3 rounded-xl transition-all duration-200 border-0 bg-transparent cursor-pointer',
                !isFab && isActive && 'bg-black/5',
              )}
              style={{ minWidth: 48 }}
            >
              {/* Icon */}
              <div
                className={cn(
                  'relative flex items-center justify-center transition-all duration-200',
                  isFab
                    ? 'w-12 h-12 rounded-full bg-black shadow-[0_4px_16px_rgba(0,0,0,0.28)] -mt-4'
                    : 'w-7 h-7',
                )}
              >
                <Icon
                  size={isFab ? 22 : 20}
                  strokeWidth={isFab || isActive ? 2.2 : 1.8}
                  className={cn(
                    isFab
                      ? 'text-white'
                      : isActive
                        ? 'text-black'
                        : 'text-black/35',
                  )}
                />
                {'badge' in tab && (tab.badge ?? 0) > 0 && (
                  <span className="absolute -top-1 -right-1 min-w-[15px] h-[15px] px-0.5 rounded-full bg-red-500 text-[9px] font-bold text-white flex items-center justify-center">
                    {(tab.badge ?? 0) > 9 ? '9+' : tab.badge}
                  </span>
                )}
              </div>

              {/* Label */}
              <span
                className={cn(
                  'text-[9px] font-medium tracking-wide transition-colors',
                  isFab
                    ? 'text-[#6F6F6F]'
                    : isActive
                      ? 'text-black font-semibold'
                      : 'text-black/35',
                )}
              >
                {tab.label}
              </span>
            </button>
          );
        })}
      </div>
      <div style={{ height: 'env(safe-area-inset-bottom)' }} />
    </nav>
  );
}
