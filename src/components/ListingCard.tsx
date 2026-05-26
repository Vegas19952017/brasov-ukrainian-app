import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { MapPin, Clock, ArrowRight, ShieldAlert, Gem, Car, Package, CheckCircle, Award } from 'lucide-react';
import { useStore } from '../store';
import { cn, formatPrice, timeAgo, truncate } from '../lib/utils';
import StarRating from './StarRating';
import type { Listing } from '../types';

interface Props {
  listing: Listing;
}

export default function ListingCard({ listing }: Props) {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const { isListingBlacklisted } = useStore();
  const isBlacklisted = isListingBlacklisted(listing);

  const isCarpooling = listing.departure_date !== null;
  const hasPhoto = listing.photos.length > 0;

  const promoLevel = listing.promotion_level || 'free';
  const isPremium = promoLevel === 'premium';
  const isBasic = promoLevel === 'basic';

  return (
    <button
      onClick={() => navigate(`/listing/${listing.id}`)}
      className={cn(
        'w-full text-left transition-all duration-300 rounded-2xl overflow-hidden',
        isPremium
          ? 'featured-glow bg-gradient-to-b from-amber/5 to-transparent border border-amber/30 hover:border-amber/50'
          : isBasic
            ? 'bg-glass border border-royal/20 hover:border-royal/40'
            : 'glass-panel-hover'
      )}
    >
      {/* Promotion Badge Header */}
      {isPremium && (
        <div className="px-4 py-1.5 bg-gradient-to-r from-amber/20 to-transparent flex items-center gap-1.5 border-b border-amber/10">
          <Gem size={10} className="text-amber animate-pulse" />
          <span className="text-[9px] font-bold text-amber tracking-wider uppercase">
            {t('listing.featured')}
          </span>
        </div>
      )}
      {isBasic && (
        <div className="px-4 py-1 bg-gradient-to-r from-royal/20 to-transparent flex items-center gap-1.5 border-b border-royal/10">
          <Award size={10} className="text-royal-light" />
          <span className="text-[9px] font-bold text-royal-light tracking-wider uppercase">
            Standard
          </span>
        </div>
      )}

      <div className="flex gap-3 p-3.5">
        {/* Photo thumbnail */}
        {hasPhoto ? (
          <div className="relative shrink-0 w-[88px] h-[88px] rounded-xl overflow-hidden border border-glass-border">
            <img
              src={listing.photos[0]}
              alt={listing.title}
              className="w-full h-full object-cover"
              loading="lazy"
            />
            {listing.photos.length > 1 && (
              <div className="absolute bottom-1 right-1 bg-black/70 backdrop-blur-sm text-white text-[9px] font-semibold px-1 py-0.5 rounded-md">
                +{listing.photos.length - 1}
              </div>
            )}
          </div>
        ) : (
          <div className="ui-icon-box shrink-0 w-[88px] h-[88px] rounded-xl border border-glass-border bg-obsidian-800/50">
            {isCarpooling ? (
              <Car size={24} className="text-violet-400" />
            ) : (
              <Package size={24} className="text-white/20" />
            )}
          </div>
        )}

        {/* Content */}
        <div className="flex-1 min-w-0">
          {/* Header Row: Title & Verification */}
          <div className="flex items-start gap-1.5 mb-1 justify-between">
            <h3 className="text-sm font-semibold text-white leading-snug line-clamp-1 flex-1">
              {listing.title}
            </h3>
            {listing.is_verified && (
              <CheckCircle size={14} className="text-emerald-400 shrink-0 mt-0.5" title="Verified Specialist" />
            )}
          </div>

          {/* Description */}
          <p className="text-[11px] text-white/45 mb-2 line-clamp-2 leading-relaxed">
            {truncate(listing.description, 100)}
          </p>

          {/* Carpooling info */}
          {isCarpooling && (
            <div className="flex items-center gap-1 text-[10px] text-violet-400 mb-2">
              <Clock size={11} />
              <span>{listing.departure_date}</span>
              <span className="text-white/20">•</span>
              <span>{listing.departure_time}</span>
              <ArrowRight size={8} className="text-white/30 mx-0.5" />
              <span className="text-white/60 truncate">{listing.origin} → {listing.destination}</span>
            </div>
          )}

          {/* Info row: Languages & Districts */}
          <div className="flex flex-wrap gap-1 mb-2.5">
            {/* Languages */}
            {listing.languages && listing.languages.length > 0 && (
              <div className="flex gap-0.5 items-center bg-white/5 border border-white/5 rounded-md px-1.5 py-0.5 text-[9px] text-white/60">
                {listing.languages.join(' · ')}
              </div>
            )}
            {/* First district */}
            {listing.districts && listing.districts.length > 0 && (
              <div className="bg-royal/10 border border-royal/20 rounded-md px-1.5 py-0.5 text-[9px] text-royal-light truncate max-w-[120px]">
                {listing.districts[0]}
                {listing.districts.length > 1 && ` +${listing.districts.length - 1}`}
              </div>
            )}
          </div>

          {/* Bottom row: Price & Rating */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              {listing.price !== null && (
                <span className="text-xs font-bold text-amber">
                  {formatPrice(listing.price, listing.currency)}
                </span>
              )}
              <StarRating rating={listing.rating_avg} size={11} />
            </div>
            <span className="text-[9px] text-white/30">
              {timeAgo(listing.created_at, i18n.language)}
            </span>
          </div>

          {/* Address text */}
          {listing.address_text && !isCarpooling && (
            <div className="flex items-center gap-1 mt-1.5 text-[9px] text-white/30">
              <MapPin size={9} />
              <span className="truncate">{listing.address_text}</span>
            </div>
          )}
        </div>
      </div>

      {/* Blacklist warning */}
      {isBlacklisted && (
        <div className="mx-3.5 mb-3 flex items-center gap-2 bg-crimson/10 border border-crimson/30 rounded-lg px-3 py-1.5">
          <ShieldAlert size={12} className="text-crimson-light shrink-0" />
          <span className="text-[10px] text-crimson-light font-medium">
            {t('listing.blacklist_warning')}
          </span>
        </div>
      )}
    </button>
  );
}
