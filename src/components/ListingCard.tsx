import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { MapPin, Clock, ArrowRight, ShieldAlert, Gem, Car, Package, CheckCircle, Award } from 'lucide-react';
import { useStore } from '../store';
import { cn, formatPrice, timeAgo, truncate } from '../lib/utils';
import StarRating from './StarRating';
import type { Listing } from '../types';

interface Props { listing: Listing; }

export default function ListingCard({ listing }: Props) {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const { isListingBlacklisted } = useStore();
  const isBlacklisted = isListingBlacklisted(listing);

  const isCarpooling = listing.departure_date !== null;
  const hasPhoto     = listing.photos.length > 0;
  const isPremium    = listing.promotion_level === 'premium';
  const isBasic      = listing.promotion_level === 'basic';

  return (
    <button
      onClick={() => navigate(`/listing/${listing.id}`)}
      className={cn(
        'w-full text-left transition-all duration-300 rounded-2xl overflow-hidden bg-white/82 backdrop-blur-sm border',
        isPremium
          ? 'border-[#c9a84c]/40 shadow-[0_0_24px_rgba(201,168,76,0.14)] hover:border-[#c9a84c]/60'
          : isBasic
            ? 'border-black/10 hover:border-black/20 shadow-card hover:shadow-card-hover'
            : 'border-black/7 hover:border-black/14 shadow-card hover:shadow-card-hover',
        'hover:-translate-y-1',
      )}
    >
      {/* Promo badge */}
      {isPremium && (
        <div className="px-4 py-1.5 bg-gradient-to-r from-[#c9a84c]/10 to-transparent flex items-center gap-1.5 border-b border-[#c9a84c]/10">
          <Gem size={10} className="text-[#c9a84c]" />
          <span className="text-[9px] font-bold text-[#c9a84c] tracking-wider uppercase">
            {t('listing.featured')}
          </span>
        </div>
      )}
      {isBasic && (
        <div className="px-4 py-1 bg-black/2 flex items-center gap-1.5 border-b border-black/5">
          <Award size={10} className="text-muted" />
          <span className="text-[9px] font-semibold text-muted tracking-wider uppercase">
            Standard
          </span>
        </div>
      )}

      <div className="flex gap-3 p-3.5">
        {/* Thumbnail */}
        {hasPhoto ? (
          <div className="relative shrink-0 w-[88px] h-[88px] rounded-xl overflow-hidden border border-black/7 bg-black/3">
            <img
              src={listing.photos[0]}
              alt={listing.title}
              className="w-full h-full object-cover"
              loading="lazy"
            />
            {listing.photos.length > 1 && (
              <div className="absolute bottom-1 right-1 bg-black/60 backdrop-blur-sm text-white text-[9px] font-semibold px-1 py-0.5 rounded-md">
                +{listing.photos.length - 1}
              </div>
            )}
          </div>
        ) : (
          <div className="shrink-0 w-[88px] h-[88px] rounded-xl border border-black/7 bg-black/3 flex items-center justify-center">
            {isCarpooling
              ? <Car size={22} className="text-muted/50" />
              : <Package size={22} className="text-muted/30" />
            }
          </div>
        )}

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start gap-1.5 mb-1 justify-between">
            <h3 className="text-sm font-semibold text-black leading-snug line-clamp-1 flex-1">
              {listing.title}
            </h3>
            {listing.is_verified && (
              <CheckCircle size={14} className="text-emerald-500 shrink-0 mt-0.5" />
            )}
          </div>

          <p className="text-[11px] text-muted/80 mb-2 line-clamp-2 leading-relaxed">
            {truncate(listing.description, 100)}
          </p>

          {isCarpooling && (
            <div className="flex items-center gap-1 text-[10px] text-muted mb-2">
              <Clock size={10} />
              <span>{listing.departure_date}</span>
              <span className="text-black/15">•</span>
              <span>{listing.departure_time}</span>
              <ArrowRight size={8} className="text-black/20 mx-0.5" />
              <span className="text-muted/70 truncate">{listing.origin} → {listing.destination}</span>
            </div>
          )}

          <div className="flex flex-wrap gap-1 mb-2.5">
            {listing.languages?.length > 0 && (
              <div className="bg-black/4 border border-black/7 rounded-md px-1.5 py-0.5 text-[9px] text-muted/80">
                {listing.languages.join(' · ')}
              </div>
            )}
            {listing.districts?.length > 0 && (
              <div className="bg-black/4 border border-black/7 rounded-md px-1.5 py-0.5 text-[9px] text-muted/80 truncate max-w-[120px]">
                {listing.districts[0]}
                {listing.districts.length > 1 && ` +${listing.districts.length - 1}`}
              </div>
            )}
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              {listing.price !== null && (
                <span className="text-xs font-bold text-[#c9a84c]">
                  {formatPrice(listing.price, listing.currency)}
                </span>
              )}
              <StarRating rating={listing.rating_avg} size={11} />
            </div>
            <span className="text-[9px] text-muted/50">
              {timeAgo(listing.created_at, i18n.language)}
            </span>
          </div>

          {listing.address_text && !isCarpooling && (
            <div className="flex items-center gap-1 mt-1.5 text-[9px] text-muted/50">
              <MapPin size={9} />
              <span className="truncate">{listing.address_text}</span>
            </div>
          )}
        </div>
      </div>

      {isBlacklisted && (
        <div className="mx-3.5 mb-3 flex items-center gap-2 bg-red-50 border border-red-200 rounded-xl px-3 py-1.5">
          <ShieldAlert size={12} className="text-red-500 shrink-0" />
          <span className="text-[10px] text-red-600 font-medium">
            {t('listing.blacklist_warning')}
          </span>
        </div>
      )}
    </button>
  );
}
