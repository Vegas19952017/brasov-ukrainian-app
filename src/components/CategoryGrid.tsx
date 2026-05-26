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

// Subtle tints for category tiles (light theme)
const CATEGORY_ACCENTS: Record<string, { bg: string; iconColor: string }> = {
  housing:     { bg: 'bg-sky-50',     iconColor: 'text-sky-500' },
  transport:   { bg: 'bg-violet-50',  iconColor: 'text-violet-500' },
  beauty:      { bg: 'bg-pink-50',    iconColor: 'text-pink-500' },
  medicine:    { bg: 'bg-rose-50',    iconColor: 'text-rose-500' },
  veterinary:  { bg: 'bg-emerald-50', iconColor: 'text-emerald-500' },
  restaurants: { bg: 'bg-orange-50',  iconColor: 'text-orange-500' },
  repair:      { bg: 'bg-yellow-50',  iconColor: 'text-yellow-600' },
  cleaning:    { bg: 'bg-cyan-50',    iconColor: 'text-cyan-500' },
  education:   { bg: 'bg-indigo-50',  iconColor: 'text-indigo-500' },
  legal:       { bg: 'bg-slate-50',   iconColor: 'text-slate-500' },
  accounting:  { bg: 'bg-lime-50',    iconColor: 'text-lime-600' },
  childcare:   { bg: 'bg-fuchsia-50', iconColor: 'text-fuchsia-500' },
  photo_video: { bg: 'bg-amber-50',   iconColor: 'text-amber-600' },
  it_services: { bg: 'bg-blue-50',    iconColor: 'text-blue-500' },
  auto:        { bg: 'bg-red-50',     iconColor: 'text-red-500' },
  delivery:    { bg: 'bg-teal-50',    iconColor: 'text-teal-500' },
  events:      { bg: 'bg-purple-50',  iconColor: 'text-purple-500' },
  pets:        { bg: 'bg-green-50',   iconColor: 'text-green-500' },
  marketplace: { bg: 'bg-amber-50',   iconColor: 'text-amber-700' },
  other:       { bg: 'bg-gray-50',    iconColor: 'text-gray-400' },
};

const TAB_GROUPS = [
  { id: 'home',     uk: 'Житло',    ro: 'Locuință',  en: 'Home',     Icon: Home,        slugs: ['housing','repair','cleaning','childcare'],       color: '#0ea5e9' },
  { id: 'business', uk: 'Бізнес',   ro: 'Afaceri',   en: 'Business', Icon: Briefcase,   slugs: ['legal','accounting','it_services','education'],  color: '#6366f1' },
  { id: 'mobility', uk: 'Переїзд',  ro: 'Mobilitate',en: 'Mobility', Icon: Car,         slugs: ['transport','auto','delivery','marketplace'],     color: '#c9a84c' },
  { id: 'leisure',  uk: 'Дозвілля', ro: 'Agrement',  en: 'Leisure',  Icon: PartyPopper, slugs: ['restaurants','events','photo_video','pets'],     color: '#a855f7' },
  { id: 'health',   uk: 'Турбота',  ro: 'Îngrijire', en: 'Care',     Icon: Heart,       slugs: ['medicine','veterinary','beauty','other'],        color: '#f43f5e' },
] as const;

interface Props { compact?: boolean; }

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

  // Compact: horizontal chip strip
  if (compact) {
    return (
      <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide px-4">
        <button
          type="button"
          onClick={() => setSelectedCategorySlug(null)}
          className={cn(
            'flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium border shrink-0 transition-all',
            !selectedCategorySlug
              ? 'bg-black text-white border-black'
              : 'bg-white/75 backdrop-blur-sm text-muted border-black/10 hover:border-black/20',
          )}
        >
          <LayoutGrid size={13} />
          {t('categories.all')}
        </button>
        {categories.map((cat) => {
          const isActive = selectedCategorySlug === cat.slug;
          const Icon = ICON_MAP[cat.icon] || MoreHorizontal;
          return (
            <button
              key={cat.id}
              type="button"
              onClick={() => handleCategoryClick(cat)}
              className={cn(
                'flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium border shrink-0 transition-all',
                isActive
                  ? 'bg-black text-white border-black'
                  : 'bg-white/75 backdrop-blur-sm text-muted border-black/10 hover:border-black/20',
              )}
            >
              <Icon size={13} />
              <span>{getLocalizedName(cat, lang)}</span>
            </button>
          );
        })}
      </div>
    );
  }

  // Full: Tab + Grid
  const group = TAB_GROUPS[activeTab];
  const tabLabel = (g: typeof TAB_GROUPS[number]) =>
    lang === 'uk' ? g.uk : lang === 'ro' ? g.ro : g.en;

  const orderedCategories = group.slugs
    .map((slug) => categories.find((c) => c.slug === slug))
    .filter(Boolean) as Category[];

  return (
    <div className="px-4 space-y-3">

      {/* Tab bar */}
      <div className="flex gap-1.5 overflow-x-auto scrollbar-hide pb-0.5">
        {TAB_GROUPS.map((g, idx) => {
          const isActive = activeTab === idx;
          const TabIcon = g.Icon;
          return (
            <button
              key={g.id}
              type="button"
              onClick={() => setActiveTab(idx)}
              className={cn(
                'flex items-center gap-1.5 px-3.5 py-2 rounded-full text-xs font-semibold shrink-0 border transition-all duration-200',
                isActive
                  ? 'bg-black text-white border-black scale-[1.03]'
                  : 'bg-white/75 backdrop-blur-sm text-muted border-black/10 hover:border-black/20 hover:text-black',
              )}
            >
              <TabIcon size={12} />
              {tabLabel(g)}
            </button>
          );
        })}
      </div>

      {/* Category grid */}
      <AnimatePresence mode="wait">
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -4 }}
          transition={{ duration: 0.15, ease: 'easeOut' }}
          className="grid grid-cols-4 gap-2"
        >
          {orderedCategories.map((cat) => {
            const accent = CATEGORY_ACCENTS[cat.slug] || CATEGORY_ACCENTS.other;
            const Icon = ICON_MAP[cat.icon] || MoreHorizontal;
            return (
              <button
                key={cat.id}
                type="button"
                onClick={() => handleCategoryClick(cat)}
                className="group flex flex-col items-center gap-2 p-3 rounded-2xl bg-white/80 backdrop-blur-sm border border-black/7 hover:border-black/14 hover:-translate-y-1 hover:shadow-card transition-all duration-200 cursor-pointer"
              >
                <div className={cn(
                  'flex items-center justify-center w-11 h-11 rounded-xl',
                  accent.bg,
                  'group-hover:scale-110 transition-transform duration-200',
                )}>
                  <Icon size={20} className={accent.iconColor} />
                </div>
                <span className="text-[10px] font-medium text-muted text-center leading-tight line-clamp-2 group-hover:text-black transition-colors">
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
