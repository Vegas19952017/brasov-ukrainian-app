import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  Home, Car, Sparkles, Heart, Dog, UtensilsCrossed, Wrench, SprayCan,
  GraduationCap, Scale, Calculator, Baby, Camera, Monitor, CarFront,
  Package, PartyPopper, PawPrint, ShoppingBag, MoreHorizontal, LayoutGrid,
  Briefcase,
} from 'lucide-react';
import { useStore } from '../store';
import { getLocalizedName, cn } from '../lib/utils';
import type { Category } from '../types';

const ICON_MAP: Record<string, React.ComponentType<{ size?: number | string; className?: string }>> = {
  Home, Car, Sparkles, Heart, Dog, UtensilsCrossed, Wrench, SprayCan,
  GraduationCap, Scale, Calculator, Baby, Camera, Monitor, CarFront,
  Package, PartyPopper, PawPrint, ShoppingBag, MoreHorizontal, Briefcase,
};

const CATEGORY_ACCENTS: Record<string, { bg: string; text: string; ring: string }> = {
  housing:     { bg: 'from-sky-500/25 to-sky-600/10',      text: 'text-sky-400',     ring: 'group-hover:ring-sky-400/30' },
  transport:   { bg: 'from-violet-500/25 to-violet-600/10', text: 'text-violet-400',  ring: 'group-hover:ring-violet-400/30' },
  beauty:      { bg: 'from-pink-500/25 to-pink-600/10',     text: 'text-pink-400',    ring: 'group-hover:ring-pink-400/30' },
  medicine:    { bg: 'from-rose-500/25 to-rose-600/10',     text: 'text-rose-400',    ring: 'group-hover:ring-rose-400/30' },
  veterinary:  { bg: 'from-emerald-500/25 to-emerald-600/10',text: 'text-emerald-400',ring: 'group-hover:ring-emerald-400/30' },
  restaurants: { bg: 'from-orange-500/25 to-orange-600/10', text: 'text-orange-400',  ring: 'group-hover:ring-orange-400/30' },
  repair:      { bg: 'from-yellow-500/25 to-yellow-600/10', text: 'text-yellow-400',  ring: 'group-hover:ring-yellow-400/30' },
  cleaning:    { bg: 'from-cyan-500/25 to-cyan-600/10',     text: 'text-cyan-400',    ring: 'group-hover:ring-cyan-400/30' },
  education:   { bg: 'from-indigo-500/25 to-indigo-600/10', text: 'text-indigo-400',  ring: 'group-hover:ring-indigo-400/30' },
  legal:       { bg: 'from-slate-400/25 to-slate-500/10',   text: 'text-slate-300',   ring: 'group-hover:ring-slate-400/30' },
  accounting:  { bg: 'from-lime-500/25 to-lime-600/10',     text: 'text-lime-400',    ring: 'group-hover:ring-lime-400/30' },
  childcare:   { bg: 'from-fuchsia-500/25 to-fuchsia-600/10',text: 'text-fuchsia-400',ring: 'group-hover:ring-fuchsia-400/30' },
  photo_video: { bg: 'from-amber-500/25 to-amber-600/10',   text: 'text-amber-400',   ring: 'group-hover:ring-amber-400/30' },
  it_services: { bg: 'from-blue-500/25 to-blue-600/10',     text: 'text-blue-400',    ring: 'group-hover:ring-blue-400/30' },
  auto:        { bg: 'from-red-500/25 to-red-600/10',       text: 'text-red-400',     ring: 'group-hover:ring-red-400/30' },
  delivery:    { bg: 'from-teal-500/25 to-teal-600/10',     text: 'text-teal-400',    ring: 'group-hover:ring-teal-400/30' },
  events:      { bg: 'from-purple-500/25 to-purple-600/10', text: 'text-purple-400',  ring: 'group-hover:ring-purple-400/30' },
  pets:        { bg: 'from-green-500/25 to-green-600/10',   text: 'text-green-400',   ring: 'group-hover:ring-green-400/30' },
  marketplace: { bg: 'from-amber-600/25 to-amber-700/10',   text: 'text-amber-500',   ring: 'group-hover:ring-amber-500/30' },
  other:       { bg: 'from-white/15 to-white/5',            text: 'text-white/60',    ring: 'group-hover:ring-white/20' },
};

// 5 logical groups — 4 categories each = 20 total
const TAB_GROUPS = [
  {
    id: 'home',
    uk: 'Житло', ro: 'Locuință', en: 'Home',
    Icon: Home,
    slugs: ['housing', 'repair', 'cleaning', 'childcare'],
    activeColor: 'text-sky-300',
    activeBg:    'bg-sky-500/10',
    activeBorder:'border-sky-400/55',
    activeGlow:  '0 0 18px rgba(56,189,248,0.22), 0 0 1px rgba(56,189,248,0.5)',
  },
  {
    id: 'business',
    uk: 'Бізнес', ro: 'Afaceri', en: 'Business',
    Icon: Briefcase,
    slugs: ['legal', 'accounting', 'it_services', 'education'],
    activeColor: 'text-indigo-300',
    activeBg:    'bg-indigo-500/10',
    activeBorder:'border-indigo-400/55',
    activeGlow:  '0 0 18px rgba(99,102,241,0.22), 0 0 1px rgba(99,102,241,0.5)',
  },
  {
    id: 'mobility',
    uk: 'Переїзд', ro: 'Mobilitate', en: 'Mobility',
    Icon: Car,
    slugs: ['transport', 'auto', 'delivery', 'marketplace'],
    activeColor: 'text-amber-300',
    activeBg:    'bg-amber-500/8',
    activeBorder:'border-amber-400/55',
    // LUMINA gold glow — signature of the Gateway theme
    activeGlow:  '0 0 20px rgba(201,168,76,0.28), 0 0 1px rgba(201,168,76,0.55)',
  },
  {
    id: 'leisure',
    uk: 'Дозвілля', ro: 'Agrement', en: 'Leisure',
    Icon: PartyPopper,
    slugs: ['restaurants', 'events', 'photo_video', 'pets'],
    activeColor: 'text-purple-300',
    activeBg:    'bg-purple-500/10',
    activeBorder:'border-purple-400/55',
    activeGlow:  '0 0 18px rgba(168,85,247,0.22), 0 0 1px rgba(168,85,247,0.5)',
  },
  {
    id: 'health',
    uk: 'Турбота', ro: 'Îngrijire', en: 'Care',
    Icon: Heart,
    slugs: ['medicine', 'veterinary', 'beauty', 'other'],
    activeColor: 'text-rose-300',
    activeBg:    'bg-rose-500/10',
    activeBorder:'border-rose-400/55',
    activeGlow:  '0 0 18px rgba(251,113,133,0.22), 0 0 1px rgba(251,113,133,0.5)',
  },
] as const;

interface Props {
  compact?: boolean;
}

export default function CategoryGrid({ compact = false }: Props) {
  const [activeTab, setActiveTab] = useState(0);
  const navigate = useNavigate();
  const { t, i18n } = useTranslation();
  const lang = i18n.language;
  const { categories, selectedCategorySlug, setSelectedCategorySlug } = useStore();

  const handleCategoryClick = (cat: Category) => {
    if (compact) {
      setSelectedCategorySlug(selectedCategorySlug === cat.slug ? null : cat.slug);
    } else {
      navigate(`/category/${cat.slug}`);
    }
  };

  // ── Compact mode: horizontal chip strip (unchanged) ──
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
              onClick={() => handleCategoryClick(cat)}
              className={cn('ui-chip', isActive && 'ui-chip--active', isActive && accent.text)}
            >
              <Icon size={14} />
              <span>{getLocalizedName(cat, lang)}</span>
            </button>
          );
        })}
      </div>
    );
  }

  // ── Full mode: Tab + Grid ──
  const group = TAB_GROUPS[activeTab];

  const tabLabel = (g: typeof TAB_GROUPS[number]) =>
    lang === 'uk' ? g.uk : lang === 'ro' ? g.ro : g.en;

  const orderedCategories = group.slugs
    .map((slug) => categories.find((c) => c.slug === slug))
    .filter(Boolean) as Category[];

  return (
    <div className="px-4 space-y-3">

      {/* ── Tab bar ── */}
      <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-0.5">
        {TAB_GROUPS.map((g, idx) => {
          const isActive = activeTab === idx;
          const TabIcon = g.Icon;
          return (
            <button
              key={g.id}
              type="button"
              onClick={() => setActiveTab(idx)}
              className={cn(
                'flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold shrink-0',
                'border backdrop-blur-sm transition-all duration-200',
                isActive
                  ? cn(g.activeBg, g.activeBorder, g.activeColor, 'scale-[1.04]')
                  : 'border-white/8 bg-white/[0.04] text-white/40 hover:text-white/65 hover:border-white/14',
              )}
              style={isActive ? { boxShadow: g.activeGlow } : undefined}
            >
              <TabIcon size={13} />
              {tabLabel(g)}
            </button>
          );
        })}
      </div>

      {/* ── Category grid — animates on tab change ── */}
      <AnimatePresence mode="wait">
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -6 }}
          transition={{ duration: 0.17, ease: 'easeOut' }}
          className="grid grid-cols-4 gap-2.5"
        >
          {orderedCategories.map((cat) => {
            const accent = CATEGORY_ACCENTS[cat.slug] || CATEGORY_ACCENTS.other;
            const Icon = ICON_MAP[cat.icon] || MoreHorizontal;
            return (
              <button
                key={cat.id}
                type="button"
                onClick={() => handleCategoryClick(cat)}
                className={cn('group ui-tile ring-1 ring-transparent', accent.ring)}
              >
                <div
                  className={cn(
                    'ui-icon-box ui-icon-box--md bg-gradient-to-br',
                    accent.bg,
                    'group-hover:scale-110 group-hover:-translate-y-0.5 transition-transform duration-300',
                  )}
                >
                  <Icon size={22} className={accent.text} />
                </div>
                <span className="text-[11px] font-medium text-white/65 text-center leading-tight line-clamp-2 group-hover:text-white transition-colors">
                  {getLocalizedName(cat, lang)}
                </span>
              </button>
            );
          })}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
