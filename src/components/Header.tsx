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
    <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-lg border-b border-black/7">
      <div className="px-4 py-3">
        {/* Top row: logo + actions */}
        <div className="flex items-center justify-between mb-3">
          <button
            type="button"
            onClick={() => navigate('/')}
            className="flex items-center gap-2.5 group"
          >
            <div className="flex items-center justify-center w-9 h-9 rounded-xl bg-black text-white font-serif font-normal text-base hover:scale-105 transition-transform">
              Б
            </div>
            <div>
              <h1 className="text-sm font-serif font-normal text-black leading-tight tracking-tight">
                Брашов
              </h1>
              <p className="text-[9px] text-muted font-medium tracking-[0.12em] uppercase">
                Українськийй
              </p>
            </div>
          </button>

          <div className="flex items-center gap-1.5">
            <NotificationBell />

            {/* Language picker */}
            <div ref={langRef} className="relative">
              <button
                type="button"
                onClick={() => setShowLangMenu(!showLangMenu)}
                className={cn(
                  'ui-btn-icon flex items-center gap-1.5 px-2.5 h-9',
                  showLangMenu && 'bg-black/5 border-black/14'
                )}
              >
                <LangCode code={language} />
                <Globe size={13} className="text-muted" />
              </button>
              {showLangMenu && (
                <div className="absolute right-0 top-full mt-2 bg-white border border-black/8 rounded-2xl shadow-card p-1.5 min-w-[168px] z-[60] animate-fade-in">
                  {LANG_OPTIONS.map((lang) => (
                    <button
                      key={lang.code}
                      type="button"
                      onClick={() => switchLang(lang.code)}
                      className={cn(
                        'w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm transition-all',
                        language === lang.code
                          ? 'bg-black text-white font-medium'
                          : 'text-foreground hover:bg-black/5'
                      )}
                    >
                      <LangCode code={lang.code} />
                      <span className="font-medium">{lang.label}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Profile avatar */}
            {profile && (
              <button
                type="button"
                onClick={() => navigate('/cabinet')}
                className="flex items-center justify-center w-9 h-9 rounded-xl bg-black/6 border border-black/8 text-foreground font-serif font-normal text-sm hover:bg-black/10 transition-colors"
              >
                {profile.first_name.charAt(0)}
              </button>
            )}
          </div>
        </div>

        {/* Search bar */}
        <div className={cn('relative transition-transform duration-200', searchFocused && 'scale-[1.01]')}>
          <Search
            size={16}
            className={cn(
              'absolute left-3.5 top-1/2 -translate-y-1/2 z-10 transition-colors',
              searchFocused ? 'text-black' : 'text-black/30'
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
              className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 flex items-center justify-center rounded-lg hover:bg-black/5 transition-colors"
            >
              <X size={13} className="text-muted" />
            </button>
          )}
        </div>
      </div>
    </header>
  );
}
