import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  Home, Car, Sparkles, Heart, Dog, UtensilsCrossed, Wrench, SprayCan,
  GraduationCap, Scale, Calculator, Baby, Camera, Monitor, CarFront,
  Package, PartyPopper, PawPrint, ShoppingBag, MoreHorizontal, LayoutGrid,
} from 'lucide-react';
import { useStore } from '../store';
import { getLocalizedName, cn } from '../lib/utils';
import type { Category } from '../types';

const ICON_MAP: Record<string, React.ComponentType<{ size?: number | string; className?: string }>> = {
  Home, Car, Sparkles, Heart, Dog, UtensilsCrossed, Wrench, SprayCan,
  GraduationCap, Scale, Calculator, Baby, Camera, Monitor, CarFront,
  Package, PartyPopper, PawPrint, ShoppingBag, MoreHorizontal,
};

const CATEGORY_ACCENTS: Record<string, { bg: string; text: string; ring: string }> = {
  housing: { bg: 'from-sky-500/25 to-sky-600/10', text: 'text-sky-400', ring: 'group-hover:ring-sky-400/30' },
  transport: { bg: 'from-violet-500/25 to-violet-600/10', text: 'text-violet-400', ring: 'group-hover:ring-violet-400/30' },
  beauty: { bg: 'from-pink-500/25 to-pink-600/10', text: 'text-pink-400', ring: 'group-hover:ring-pink-400/30' },
  medicine: { bg: 'from-rose-500/25 to-rose-600/10', text: 'text-rose-400', ring: 'group-hover:ring-rose-400/30' },
  veterinary: { bg: 'from-emerald-500/25 to-emerald-600/10', text: 'text-emerald-400', ring: 'group-hover:ring-emerald-400/30' },
  restaurants: { bg: 'from-orange-500/25 to-orange-600/10', text: 'text-orange-400', ring: 'group-hover:ring-orange-400/30' },
  repair: { bg: 'from-yellow-500/25 to-yellow-600/10', text: 'text-yellow-400', ring: 'group-hover:ring-yellow-400/30' },
  cleaning: { bg: 'from-cyan-500/25 to-cyan-600/10', text: 'text-cyan-400', ring: 'group-hover:ring-cyan-400/30' },
  education: { bg: 'from-indigo-500/25 to-indigo-600/10', text: 'text-indigo-400', ring: 'group-hover:ring-indigo-400/30' },
  legal: { bg: 'from-slate-400/25 to-slate-500/10', text: 'text-slate-300', ring: 'group-hover:ring-slate-400/30' },
  accounting: { bg: 'from-lime-500/25 to-lime-600/10', text: 'text-lime-400', ring: 'group-hover:ring-lime-400/30' },
  childcare: { bg: 'from-fuchsia-500/25 to-fuchsia-600/10', text: 'text-fuchsia-400', ring: 'group-hover:ring-fuchsia-400/30' },
  photo_video: { bg: 'from-amber-500/25 to-amber-600/10', text: 'text-amber-400', ring: 'group-hover:ring-amber-400/30' },
  it_services: { bg: 'from-blue-500/25 to-blue-600/10', text: 'text-blue-400', ring: 'group-hover:ring-blue-400/30' },
  auto: { bg: 'from-red-500/25 to-red-600/10', text: 'text-red-400', ring: 'group-hover:ring-red-400/30' },
  delivery: { bg: 'from-teal-500/25 to-teal-600/10', text: 'text-teal-400', ring: 'group-hover:ring-teal-400/30' },
  events: { bg: 'from-purple-500/25 to-purple-600/10', text: 'text-purple-400', ring: 'group-hover:ring-purple-400/30' },
  pets: { bg: 'from-green-500/25 to-green-600/10', text: 'text-green-400', ring: 'group-hover:ring-green-400/30' },
  marketplace: { bg: 'from-amber-600/25 to-amber-700/10', text: 'text-amber-500', ring: 'group-hover:ring-amber-500/30' },
  other: { bg: 'from-white/15 to-white/5', text: 'text-white/60', ring: 'group-hover:ring-white/20' },
};

interface Props {
  compact?: boolean;
}

export default function CategoryGrid({ compact = false }: Props) {
  const navigate = useNavigate();
  const { t, i18n } = useTranslation();
  const { categories, selectedCategorySlug, setSelectedCategorySlug } = useStore();

  const handleClick = (cat: Category) => {
    if (compact) {
      setSelectedCategorySlug(selectedCategorySlug === cat.slug ? null : cat.slug);
    } else {
      navigate(`/category/${cat.slug}`);
    }
  };

  if (compact) {
    return (
      <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide px-4">
        <button
          type="button"
          onClick={() => setSelectedCategorySlug(null)}
          className={cn('ui-chip', !selectedCategorySlug && 'ui-chip--active')}
        >
          <LayoutGrid size={14} />
          {t('categories.all')}
        </button>
        {categories.map((cat) => {
          const accent = CATEGORY_ACCENTS[cat.slug] || CATEGORY_ACCENTS.other;
          const isActive = selectedCategorySlug === cat.slug;
          const Icon = ICON_MAP[cat.icon] || MoreHorizontal;
          return (
            <button
              key={cat.id}
              type="button"
              onClick={() => handleClick(cat)}
              className={cn('ui-chip', isActive && 'ui-chip--active', isActive && accent.text)}
            >
              <Icon size={14} />
              <span>{getLocalizedName(cat, i18n.language)}</span>
            </button>
          );
        })}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-4 gap-2.5 px-4">
      {categories.map((cat) => {
        const accent = CATEGORY_ACCENTS[cat.slug] || CATEGORY_ACCENTS.other;
        const Icon = ICON_MAP[cat.icon] || MoreHorizontal;
        return (
          <button
            key={cat.id}
            type="button"
            onClick={() => handleClick(cat)}
            className={cn('group ui-tile ring-1 ring-transparent', accent.ring)}
          >
            <div
              className={cn(
                'ui-icon-box ui-icon-box--md bg-gradient-to-br',
                accent.bg,
                'group-hover:scale-110 group-hover:-translate-y-0.5 transition-transform duration-300'
              )}
            >
              <Icon size={22} className={accent.text} />
            </div>
            <span className="text-[11px] font-medium text-white/65 text-center leading-tight line-clamp-2 group-hover:text-white transition-colors">
              {getLocalizedName(cat, i18n.language)}
            </span>
          </button>
        );
      })}
    </div>
  );
}
