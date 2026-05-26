import { useTranslation } from 'react-i18next';
import { SearchX } from 'lucide-react';
import EmptyState from '../components/ui/EmptyState';
import ScrollExpandHero from '../components/ui/ScrollExpandHero';
import CategoryGrid from '../components/CategoryGrid';
import ListingCard from '../components/ListingCard';
import FilterBar from '../components/FilterBar';
import { useStore } from '../store';

// Brașov city panorama (free Unsplash)
const BG_IMAGE = 'https://images.unsplash.com/photo-1588880331179-bc9b93a8cb5e?q=80&w=1920&auto=format&fit=crop';
// Narrower city card photo shown while expanding
const CARD_IMAGE = 'https://images.unsplash.com/photo-1578662996442-48f60103fc96?q=80&w=1280&auto=format&fit=crop';

export default function HomePage() {
  const { t } = useTranslation();
  const { getFilteredListings } = useStore();
  const listings = getFilteredListings();

  return (
    <ScrollExpandHero
      bgImageSrc={BG_IMAGE}
      mediaSrc={CARD_IMAGE}
      title={t('home.title')}
      subtitle={t('home.subtitle')}
      scrollToExpand={t('home.scroll_hint')}
    >
      {/* ─── Catalog content revealed after hero expands ─── */}
      <div className="space-y-5 py-4 bg-obsidian min-h-screen">
        <CategoryGrid />
        <FilterBar />
        <div className="px-4 space-y-3">
          {listings.length > 0 ? (
            listings.map((listing) => (
              <ListingCard key={listing.id} listing={listing} />
            ))
          ) : (
            <div className="glass-panel">
              <EmptyState icon={SearchX} message={t('listing.no_listings')} />
            </div>
          )}
        </div>
      </div>
    </ScrollExpandHero>
  );
}
