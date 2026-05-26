import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import {
  Star, FileText, Trash2, Edit, Plus, ClipboardList,
  MessageSquare, AlertCircle, CheckCircle, Clock, XCircle,
  CornerDownRight, ChevronRight
} from 'lucide-react';
import EmptyState from '../components/ui/EmptyState';
import StatusBadge from '../components/ui/StatusBadge';
import { useStore } from '../store';
import { cn, formatPrice, timeAgo } from '../lib/utils';
import StarRating from '../components/StarRating';
import toast from 'react-hot-toast';

type CabinetTab = 'listings' | 'reviews';

export default function CabinetPage() {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<CabinetTab>('listings');
  const { profile, listings, reviews, removeListing } = useStore();
  const statusKey = profile?.status ?? 'pending';

  if (!profile) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <p className="text-white/40 text-sm">{t('chat.auth_required')}</p>
      </div>
    );
  }

  const myListings = listings.filter((l) => l.user_id === profile.id || l.user_id === 'user-demo');
  const approvedListings = myListings.filter((l) => l.status === 'approved');
  const avgRating =
    approvedListings.length > 0
      ? approvedListings.reduce((sum, l) => sum + l.rating_avg, 0) / approvedListings.length
      : 0;

  // NEW: collect all approved reviews received on my listings
  const myApprovedListingIds = approvedListings.map((l) => l.id);
  const receivedReviews = reviews
    .filter((r) => myApprovedListingIds.includes(r.listing_id) && r.status === 'approved')
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

  const handleDelete = (id: string) => {
    if (window.confirm(t('cabinet.delete_confirm'))) {
      removeListing(id);
      toast.success(t('cabinet.deleted'));
    }
  };

  return (
    <div className="px-4 py-5 space-y-5 animate-fade-in">
      {/* Profile header */}
      <div className="glass-panel p-5">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-royal to-amber flex items-center justify-center text-white text-xl font-bold shadow-blue-glow">
            {profile.first_name.charAt(0)}
          </div>
          <div className="flex-1">
            <h2 className="text-lg font-display font-bold text-white">
              {profile.first_name}
            </h2>
            {profile.username && (
              <p className="text-xs text-white/40 mt-0.5">@{profile.username}</p>
            )}
            <span
              className={cn(
                'inline-flex items-center gap-1 mt-1.5 text-[10px] font-bold rounded-full px-2 py-0.5 border',
                statusKey === 'approved' && 'text-emerald-400 bg-emerald-500/15 border-emerald-500/30',
                statusKey === 'pending' && 'text-amber bg-amber/15 border-amber/30',
                statusKey === 'rejected' && 'text-crimson-light bg-crimson/15 border-crimson/30',
              )}
            >
              {t(`profile.status_${statusKey}`)}
            </span>
            {profile.role === 'admin' && (
              <span className="inline-flex items-center gap-1 mt-1 text-[10px] font-bold text-royal-light bg-royal/15 border border-royal/30 rounded-full px-2 py-0.5 ml-1">
                Admin
              </span>
            )}
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 gap-3 mt-5">
          <div className="ui-tile min-h-0 p-3.5 text-center !items-center">
            <div className="flex items-center justify-center gap-1.5 mb-1">
              <FileText size={14} className="text-royal-light" />
              <span className="text-[10px] text-white/40 uppercase tracking-wider">{t('cabinet.total_listings')}</span>
            </div>
            <p className="text-2xl font-bold text-white">{myListings.length}</p>
          </div>
          <div className="ui-tile min-h-0 p-3.5 text-center !items-center">
            <div className="flex items-center justify-center gap-1.5 mb-1">
              <Star size={14} className="text-amber" />
              <span className="text-[10px] text-white/40 uppercase tracking-wider">{t('cabinet.rating')}</span>
            </div>
            <p className="text-2xl font-bold text-amber">{avgRating.toFixed(1)}</p>
          </div>
        </div>
      </div>

      {/* NEW: Tabs: My Listings / My Reviews */}
      <div className="flex gap-2">
        <button
          type="button"
          onClick={() => setActiveTab('listings')}
          className={cn(
            'flex-1 py-2.5 rounded-xl text-xs font-bold border transition-all duration-200 flex items-center justify-center gap-1.5',
            activeTab === 'listings'
              ? 'bg-royal/20 text-royal-light border-royal/40'
              : 'bg-obsidian-800/20 border-glass-border text-white/40'
          )}
        >
          <FileText size={13} />
          {t('cabinet.my_listings')}
          {myListings.length > 0 && (
            <span className="bg-royal/30 text-royal-light rounded-full text-[9px] font-black px-1.5 py-0.5 min-w-[18px] text-center">
              {myListings.length}
            </span>
          )}
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('reviews')}
          className={cn(
            'flex-1 py-2.5 rounded-xl text-xs font-bold border transition-all duration-200 flex items-center justify-center gap-1.5',
            activeTab === 'reviews'
              ? 'bg-amber/20 text-amber border-amber/40'
              : 'bg-obsidian-800/20 border-glass-border text-white/40'
          )}
        >
          <MessageSquare size={13} />
          Мои отзывы
          {receivedReviews.length > 0 && (
            <span className="bg-amber/30 text-amber rounded-full text-[9px] font-black px-1.5 py-0.5 min-w-[18px] text-center">
              {receivedReviews.length}
            </span>
          )}
        </button>
      </div>

      {/* Tab: My Listings */}
      {activeTab === 'listings' && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-display font-bold text-white">{t('cabinet.my_listings')}</h3>
            <button
              onClick={() => navigate('/add')}
              className="flex items-center gap-1.5 text-xs text-royal-light font-semibold hover:underline"
            >
              <Plus size={14} />
              {t('add_listing.title')}
            </button>
          </div>

          {myListings.length > 0 ? (
            myListings.map((listing) => (
              <div
                key={listing.id}
                className={cn(
                  'glass-panel p-4 space-y-3',
                  listing.is_featured && 'featured-glow border-amber/30'
                )}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <h4 className="text-sm font-semibold text-white line-clamp-1">
                      {listing.title}
                    </h4>
                    <p className="text-xs text-white/40 mt-1 line-clamp-1">
                      {listing.description}
                    </p>
                  </div>
                  <StatusBadge status={listing.status} />
                </div>

                {/* NEW: show rejection reason if present */}
                {listing.status === 'rejected' && listing.rejection_reason && (
                  <div className="flex items-start gap-2 bg-crimson/10 border border-crimson/20 rounded-xl p-3">
                    <AlertCircle size={14} className="text-crimson-light shrink-0 mt-0.5" />
                    <div>
                      <p className="text-[10px] font-bold text-crimson-light">Причина отклонения:</p>
                      <p className="text-xs text-white/60 mt-0.5 leading-relaxed">{listing.rejection_reason}</p>
                    </div>
                  </div>
                )}

                {/* NEW: friendly hint for pending listings */}
                {listing.status === 'pending' && (
                  <div className="flex items-center gap-2 bg-amber/5 border border-amber/15 rounded-xl px-3 py-2">
                    <Clock size={12} className="text-amber shrink-0" />
                    <p className="text-[10px] text-amber/80">На проверке у модератора. Обычно 1–24 часа.</p>
                  </div>
                )}

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    {listing.price !== null && (
                      <span className="text-sm font-bold text-amber">
                        {formatPrice(listing.price, listing.currency)}
                      </span>
                    )}
                    <StarRating rating={listing.rating_avg} size={12} />
                  </div>
                  <span className="text-[10px] text-white/30">
                    {timeAgo(listing.created_at, i18n.language)}
                  </span>
                </div>

                <div className="flex gap-2 pt-1">
                  <button
                    onClick={() => navigate(`/listing/${listing.id}/edit`)}
                    className="btn-ghost text-xs flex items-center gap-1 flex-1 justify-center"
                  >
                    <Edit size={12} />
                    {t('cabinet.edit')}
                  </button>
                  <button
                    onClick={() => navigate(`/listing/${listing.id}`)}
                    className="btn-ghost text-xs flex items-center gap-1 flex-1 justify-center"
                  >
                    <ChevronRight size={12} />
                    Открыть
                  </button>
                  <button
                    onClick={() => handleDelete(listing.id)}
                    className="btn-ghost text-xs flex items-center gap-1 flex-1 justify-center text-crimson-light/70 border-crimson/20 hover:bg-crimson/10 hover:text-crimson-light"
                  >
                    <Trash2 size={12} />
                    {t('cabinet.delete')}
                  </button>
                </div>
              </div>
            ))
          ) : (
            <div className="glass-panel">
              <EmptyState icon={ClipboardList} message={t('cabinet.no_listings')} />
              <button
                onClick={() => navigate('/add')}
                className="btn-primary py-2 px-4 text-xs mt-2"
              >
                {t('add_listing.title')}
              </button>
            </div>
          )}
        </div>
      )}

      {/* NEW Tab: Received Reviews */}
      {activeTab === 'reviews' && (
        <div className="space-y-3">
          <h3 className="text-sm font-display font-bold text-white">Отзывы о моих услугах</h3>

          {receivedReviews.length > 0 ? (
            receivedReviews.map((rev) => {
              const sourceListing = listings.find((l) => l.id === rev.listing_id);
              return (
                <div key={rev.id} className="glass-panel p-4 space-y-3 border border-glass-border">
                  {/* Listing reference */}
                  {sourceListing && (
                    <button
                      type="button"
                      onClick={() => navigate(`/listing/${sourceListing.id}`)}
                      className="flex items-center gap-1.5 text-[10px] text-royal-light font-semibold hover:underline"
                    >
                      <ChevronRight size={11} />
                      {sourceListing.title}
                    </button>
                  )}

                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-xs font-bold text-white/80">
                        {rev.profile?.first_name ?? 'Клиент'}
                      </span>
                      {rev.profile?.username && (
                        <span className="text-[10px] text-white/30 ml-1.5">@{rev.profile.username}</span>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <StarRating rating={rev.rating} size={13} />
                      <span className="text-[10px] text-white/30">{timeAgo(rev.created_at, i18n.language)}</span>
                    </div>
                  </div>

                  {rev.comment && (
                    <p className="text-xs text-white/60 leading-relaxed font-medium italic">
                      "{rev.comment}"
                    </p>
                  )}

                  {/* Owner reply preview */}
                  {rev.owner_reply && (
                    <div className="ml-3 pl-3 border-l-2 border-royal/40 py-0.5">
                      <div className="flex items-center gap-1.5 mb-1">
                        <CornerDownRight size={10} className="text-royal-light" />
                        <span className="text-[9px] font-bold text-royal-light">Ваш ответ</span>
                      </div>
                      <p className="text-[11px] text-white/50 leading-relaxed italic">{rev.owner_reply}</p>
                    </div>
                  )}

                  {/* Prompt to reply if no reply yet */}
                  {!rev.owner_reply && (
                    <button
                      type="button"
                      onClick={() => navigate(`/listing/${rev.listing_id}`)}
                      className="text-[10px] text-royal-light font-bold hover:underline flex items-center gap-1"
                    >
                      <CornerDownRight size={10} />
                      Ответить на отзыв
                    </button>
                  )}
                </div>
              );
            })
          ) : (
            <div className="glass-panel">
              <EmptyState
                icon={MessageSquare}
                message="Пока нет опубликованных отзывов о ваших услугах."
                className="py-10"
              />
            </div>
          )}
        </div>
      )}
    </div>
  );
}
