import { useTranslation } from 'react-i18next';
import { SearchX } from 'lucide-react';
import EmptyState from '../components/ui/EmptyState';
import ScrollExpandHero from '../components/ui/ScrollExpandHero';
import CategoryGrid from '../components/CategoryGrid';
import ListingCard from '../components/ListingCard';
import FilterBar from '../components/FilterBar';
import { useStore } from '../store';

export default function HomePage() {
  const { t } = useTranslation();
  const { getFilteredListings } = useStore();
  const listings = getFilteredListings();

  return (
    <ScrollExpandHero
      subtitle={t('home.subtitle')}
      scrollToExpand={t('home.scroll_hint')}
    >
      <div className="space-y-5 py-4 bg-white min-h-screen">
        <CategoryGrid />
        <FilterBar />
        <div className="px-4 space-y-3">
          {listings.length > 0 ? (
            listings.map((listing) => (
              <ListingCard key={listing.id} listing={listing} />
            ))
          ) : (
            <div className="bg-white rounded-2xl border border-black/7 shadow-card">
              <EmptyState icon={SearchX} message={t('listing.no_listings')} />
            </div>
          )}
        </div>
      </div>
    </ScrollExpandHero>
  );
}
