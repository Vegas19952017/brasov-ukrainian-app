import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, X, Globe } from 'lucide-react';
import NotificationBell from './NotificationBell';
import LangCode from './ui/LangCode';
import { useTranslation } from 'react-i18next';
import { useStore } from '../store';
import { cn } from '../lib/utils';
import type { Language } from '../types';

const LANG_OPTIONS: { code: Language; label: string }[] = [
  { code: 'uk', label: 'Українська' },
  { code: 'ro', label: 'Română' },
  { code: 'en', label: 'English' },
];

export default function Header() {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const { language, setLanguage, filters, setFilters, profile } = useStore();
  const [showLangMenu, setShowLangMenu] = useState(false);
  const [searchFocused, setSearchFocused] = useState(false);
  const langRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (langRef.current && !langRef.current.contains(e.target as Node)) {
        setShowLangMenu(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const switchLang = (lang: Language) => {
    setLanguage(lang);
    i18n.changeLanguage(lang);
    setShowLangMenu(false);
  };

  return (
    <header className="sticky top-0 z-50 ui-nav-dock border-b border-glass-border">
      <div className="px-4 py-3">
        <div className="flex items-center justify-between mb-3">
          <button
            type="button"
            onClick={() => navigate('/')}
            className="flex items-center gap-2.5 group"
          >
            <div className="ui-icon-box ui-icon-box--md bg-gradient-to-br from-royal to-royal-dark border-royal/40 group-hover:scale-105 transition-transform">
              <span className="text-base font-display font-bold text-white">Б</span>
            </div>
            <div>
              <h1 className="text-sm font-display font-bold text-white leading-tight">Брашов</h1>
              <p className="text-[10px] text-amber font-semibold tracking-widest uppercase">
                Український
              </p>
            </div>
          </button>

          <div className="flex items-center gap-2">
            <NotificationBell />
            <div ref={langRef} className="relative">
              <button
                type="button"
                onClick={() => setShowLangMenu(!showLangMenu)}
                className={cn(
                  'ui-btn-icon flex items-center gap-2 px-2.5 h-9',
                  showLangMenu && 'border-royal/40'
                )}
              >
                <LangCode code={language} />
                <Globe size={14} className="text-white/50" />
              </button>
              {showLangMenu && (
                <div className="absolute right-0 top-full mt-2 glass-panel p-1.5 min-w-[168px] animate-fade-in z-[60]">
                  {LANG_OPTIONS.map((lang) => (
                    <button
                      key={lang.code}
                      type="button"
                      onClick={() => switchLang(lang.code)}
                      className={cn(
                        'w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm transition-all',
                        language === lang.code
                          ? 'bg-royal/20 text-royal-light ui-surface'
                          : 'text-white/70 hover:bg-white/5'
                      )}
                    >
                      <LangCode code={lang.code} />
                      <span className="font-medium">{lang.label}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
            {profile && (
              <button
                type="button"
                onClick={() => navigate('/cabinet')}
                className="ui-icon-box ui-icon-box--md border-amber/35 text-amber font-bold text-sm hover:border-amber/50"
              >
                {profile.first_name.charAt(0)}
              </button>
            )}
          </div>
        </div>

        <div className={cn('relative transition-transform duration-200', searchFocused && 'scale-[1.01]')}>
          <Search
            size={18}
            className={cn(
              'absolute left-3.5 top-1/2 -translate-y-1/2 z-10',
              searchFocused ? 'text-royal-light' : 'text-white/30'
            )}
          />
          <input
            type="text"
            value={filters.query}
            onChange={(e) => setFilters({ query: e.target.value })}
            onFocus={() => setSearchFocused(true)}
            onBlur={() => setSearchFocused(false)}
            placeholder={t('header.search_placeholder')}
            className="input-glass pl-11 pr-10 py-3 text-sm w-full"
          />
          {filters.query && (
            <button
              type="button"
              onClick={() => setFilters({ query: '' })}
              className="ui-btn-icon absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8"
            >
              <X size={14} className="text-white/50" />
            </button>
          )}
        </div>
      </div>
    </header>
  );
}
