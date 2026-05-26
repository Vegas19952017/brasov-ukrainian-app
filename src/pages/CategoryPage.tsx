import { useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useStore } from '../store';
import { getLocalizedName } from '../lib/utils';
import { FolderOpen } from 'lucide-react';
import ListingCard from '../components/ListingCard';
import EmptyState from '../components/ui/EmptyState';
import FilterBar from '../components/FilterBar';
import CategoryGrid from '../components/CategoryGrid';

export default function CategoryPage() {
  const { slug } = useParams<{ slug: string }>();
  const { i18n, t } = useTranslation();
  const { categories, setSelectedCategorySlug, getFilteredListings } = useStore();

  useEffect(() => {
    if (slug) {
      setSelectedCategorySlug(slug);
    }
    return () => setSelectedCategorySlug(null);
  }, [slug, setSelectedCategorySlug]);

  const category = categories.find((c) => c.slug === slug);
  const listings = getFilteredListings();

  return (
    <div className="space-y-4 py-4">
      {/* Category title */}
      {category && (
        <div className="px-4">
          <h2 className="text-lg font-display font-bold text-white">
            {getLocalizedName(category, i18n.language)}
          </h2>
          <p className="text-xs text-white/40 mt-0.5">
            {listings.length} {t('cabinet.total_listings').toLowerCase()}
          </p>
        </div>
      )}

      {/* Compact category scroller */}
      <CategoryGrid compact />

      {/* Filters */}
      <FilterBar />

      {/* Listings */}
      <div className="px-4 space-y-3">
        {listings.length > 0 ? (
          listings.map((listing) => (
            <ListingCard key={listing.id} listing={listing} />
          ))
        ) : (
          <div className="glass-panel">
            <EmptyState icon={FolderOpen} message={t('listing.no_listings')} />
          </div>
        )}
      </div>
    </div>
  );
}
