import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { SlidersHorizontal, RotateCcw, ChevronDown, Car, Star, Languages, Map } from 'lucide-react';
import { useStore } from '../store';
import { cn } from '../lib/utils';

const DISTRICTS = [
  'Astra', 'Bartolomeu', 'Blumăna', 'Brașovechi', 'Centrul Civic', 'Centrul Istoric',
  'Craiter', 'Dârste', 'Florilor', 'Gării', 'Griviței', 'Noua', 'Poiana Brașov',
  'Răcădău', 'Scriitorilor', 'Stupini', 'Șchei', 'Timiș-Triaj', 'Tractorul', 'Out of Town / Delivery'
];

const LANGUAGES = ['RU', 'RO', 'EN', 'UA'];

export default function FilterBar() {
  const { t } = useTranslation();
  const { filters, setFilters, resetFilters, selectedCategorySlug } = useStore();
  const [expanded, setExpanded] = useState(false);

  const isCarpooling = selectedCategorySlug === 'transport';
  const hasActiveFilters =
    filters.min_price !== null ||
    filters.max_price !== null ||
    filters.currency !== null ||
    filters.departure_date !== null ||
    filters.origin !== null ||
    filters.destination !== null ||
    (filters.languages && filters.languages.length > 0) ||
    (filters.districts && filters.districts.length > 0) ||
    filters.min_rating !== null;

  const toggleLanguage = (lang: string) => {
    const current = filters.languages || [];
    const next = current.includes(lang)
      ? current.filter((l) => l !== lang)
      : [...current, lang];
    setFilters({ languages: next });
  };

  const toggleDistrict = (dist: string) => {
    const current = filters.districts || [];
    const next = current.includes(dist)
      ? current.filter((d) => d !== dist)
      : [...current, dist];
    setFilters({ districts: next });
  };

  return (
    <div className="px-4 space-y-2">
      {/* Sort + expand toggle */}
      <div className="flex items-center gap-2">
        {/* Sort dropdown */}
        <div className="relative flex-1">
          <select
            value={filters.sort_by}
            onChange={(e) => setFilters({ sort_by: e.target.value as any })}
            className="input-glass py-2.5 pr-8 text-xs appearance-none cursor-pointer"
          >
            <option value="newest">{t('filter.sort_newest')}</option>
            <option value="rating">{t('filter.sort_rating')}</option>
            <option value="price_asc">{t('filter.sort_price_asc')}</option>
            <option value="price_desc">{t('filter.sort_price_desc')}</option>
          </select>
          <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-white/30 pointer-events-none" />
        </div>

        {/* Filter toggle */}
        <button
          type="button"
          onClick={() => setExpanded(!expanded)}
          className={cn(
            'ui-chip text-xs',
            (expanded || hasActiveFilters) && 'ui-chip--active'
          )}
        >
          <SlidersHorizontal size={14} />
          {hasActiveFilters && (
            <div className="w-1.5 h-1.5 rounded-full bg-amber animate-pulse" />
          )}
        </button>

        {hasActiveFilters && (
          <button
            type="button"
            onClick={resetFilters}
            className="ui-btn-icon w-10 h-10 text-white/40 hover:text-crimson-light hover:border-crimson/30"
          >
            <RotateCcw size={14} />
          </button>
        )}
      </div>

      {/* Expanded filters */}
      {expanded && (
        <div className="glass-panel p-4 space-y-4 animate-slide-up max-h-[75vh] overflow-y-auto">
          {/* Price filters */}
          <div className="space-y-1.5">
            <label className="text-[10px] text-white/40 font-semibold uppercase tracking-wider">{t('listing.price')}</label>
            <div className="grid grid-cols-2 gap-2">
              <input
                type="number"
                value={filters.min_price ?? ''}
                onChange={(e) =>
                  setFilters({ min_price: e.target.value ? Number(e.target.value) : null })
                }
                placeholder={t('filter.min_price')}
                className="input-glass py-2 text-xs"
              />
              <input
                type="number"
                value={filters.max_price ?? ''}
                onChange={(e) =>
                  setFilters({ max_price: e.target.value ? Number(e.target.value) : null })
                }
                placeholder={t('filter.max_price')}
                className="input-glass py-2 text-xs"
              />
            </div>
          </div>

          {/* Currency filter */}
          <div className="flex gap-2">
            {['RON', 'EUR', 'UAH'].map((cur) => (
              <button
                key={cur}
                onClick={() =>
                  setFilters({ currency: filters.currency === cur ? null : cur })
                }
                className={cn(
                  'ui-chip py-1.5 flex-1',
                  filters.currency === cur && 'ui-chip--active text-amber border-amber/40'
                )}
              >
                {cur}
              </button>
            ))}
          </div>

          {/* Languages filter */}
          <div className="space-y-1.5 pt-2 border-t border-glass-border">
            <p className="text-[10px] text-white/40 font-semibold uppercase tracking-wider flex items-center gap-1.5">
              <Languages size={12} className="text-royal-light" />
              {t('common.language')}
            </p>
            <div className="flex gap-2">
              {LANGUAGES.map((lang) => {
                const active = filters.languages?.includes(lang);
                return (
                  <button
                    key={lang}
                    type="button"
                    onClick={() => toggleLanguage(lang)}
                    className={cn(
                      'ui-chip py-1.5 flex-1 text-center',
                      active && 'ui-chip--active text-royal-light'
                    )}
                  >
                    {lang}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Rating filter */}
          <div className="space-y-1.5 pt-2 border-t border-glass-border">
            <p className="text-[10px] text-white/40 font-semibold uppercase tracking-wider flex items-center gap-1.5">
              <Star size={12} className="text-amber" />
              {t('cabinet.rating')}
            </p>
            <div className="flex gap-2">
              {[4.0, 4.5].map((rating) => {
                const active = filters.min_rating === rating;
                return (
                  <button
                    key={rating}
                    type="button"
                    onClick={() =>
                      setFilters({ min_rating: filters.min_rating === rating ? null : rating })
                    }
                    className={cn(
                      'ui-chip py-1.5 flex-1',
                      active && 'ui-chip--active text-amber border-amber/40'
                    )}
                  >
                    ★ {rating}+
                  </button>
                );
              })}
            </div>
          </div>

          {/* Districts filter */}
          <div className="space-y-1.5 pt-2 border-t border-glass-border">
            <p className="text-[10px] text-white/40 font-semibold uppercase tracking-wider flex items-center gap-1.5">
              <Map size={12} className="text-royal-light" />
              Район Брашова
            </p>
            <div className="flex flex-wrap gap-1.5 max-h-[140px] overflow-y-auto p-1 bg-obsidian-900/50 rounded-xl border border-glass-border">
              {DISTRICTS.map((dist) => {
                const active = filters.districts?.includes(dist);
                return (
                  <button
                    key={dist}
                    type="button"
                    onClick={() => toggleDistrict(dist)}
                    className={cn(
                      'px-2.5 py-1.5 rounded-lg border text-[10px] font-medium transition-all duration-200',
                      active
                        ? 'bg-royal/20 text-royal-light border-royal/40'
                        : 'bg-obsidian-800/40 text-white/50 border-glass-border hover:bg-glass-hover hover:text-white'
                    )}
                  >
                    {dist === 'Out of Town / Delivery' ? 'Выезд по городу' : dist}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Carpooling-specific filters */}
          {isCarpooling && (
            <div className="space-y-2 pt-2 border-t border-glass-border">
              <p className="text-[11px] text-violet-400 font-semibold uppercase tracking-wider flex items-center gap-1.5">
                <Car size={14} />
                {t('carpooling.title')}
              </p>
              <input
                type="date"
                value={filters.departure_date ?? ''}
                onChange={(e) =>
                  setFilters({ departure_date: e.target.value || null })
                }
                className="input-glass py-2 text-xs"
              />
              <div className="grid grid-cols-2 gap-2">
                <input
                  type="text"
                  value={filters.origin ?? ''}
                  onChange={(e) =>
                    setFilters({ origin: e.target.value || null })
                  }
                  placeholder={t('carpooling.origin_placeholder')}
                  className="input-glass py-2 text-xs"
                />
                <input
                  type="text"
                  value={filters.destination ?? ''}
                  onChange={(e) =>
                    setFilters({ destination: e.target.value || null })
                  }
                  placeholder={t('carpooling.destination_placeholder')}
                  className="input-glass py-2 text-xs"
                />
              </div>
            </div>
          )}

          <button
            type="button"
            onClick={() => setExpanded(false)}
            className="w-full btn-primary py-2.5 text-xs font-semibold"
          >
            {t('filter.apply')}
          </button>
        </div>
      )}
    </div>
  );
}
