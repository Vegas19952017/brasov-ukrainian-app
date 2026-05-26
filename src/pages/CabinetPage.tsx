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
        <p className="text-muted text-sm">{t('chat.auth_required')}</p>
      </div>
    );
  }

  const myListings = listings.filter((l) => l.user_id === profile.id || l.user_id === 'user-demo');
  const approvedListings = myListings.filter((l) => l.status === 'approved');
  const avgRating =
    approvedListings.length > 0
      ? approvedListings.reduce((sum, l) => sum + l.rating_avg, 0) / approvedListings.length
      : 0;

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
          <div className="w-14 h-14 rounded-2xl bg-black flex items-center justify-center text-white text-xl font-bold">
            {profile.first_name.charAt(0)}
          </div>
          <div className="flex-1">
            <h2 className="text-lg font-display font-bold text-foreground">
              {profile.first_name}
            </h2>
            {profile.username && (
              <p className="text-xs text-muted mt-0.5">@{profile.username}</p>
            )}
            <span
              className={cn(
                'inline-flex items-center gap-1 mt-1.5 text-[10px] font-bold rounded-full px-2 py-0.5 border',
                statusKey === 'approved' && 'text-emerald-600 bg-emerald-50 border-emerald-200',
                statusKey === 'pending' && 'text-[#c9a84c] bg-[#c9a84c]/10 border-[#c9a84c]/25',
                statusKey === 'rejected' && 'text-red-500 bg-red-50 border-red-200',
              )}
            >
              {t(`profile.status_${statusKey}`)}
            </span>
            {profile.role === 'admin' && (
              <span className="inline-flex items-center gap-1 mt-1 text-[10px] font-bold text-black bg-black/7 border border-black/12 rounded-full px-2 py-0.5 ml-1">
                Admin
              </span>
            )}
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 gap-3 mt-5">
          <div className="ui-tile min-h-0 p-3.5 text-center !items-center">
            <div className="flex items-center justify-center gap-1.5 mb-1">
              <FileText size={14} className="text-muted" />
              <span className="text-[10px] text-black/40 uppercase tracking-wider">{t('cabinet.total_listings')}</span>
            </div>
            <p className="text-2xl font-bold text-foreground">{myListings.length}</p>
          </div>
          <div className="ui-tile min-h-0 p-3.5 text-center !items-center">
            <div className="flex items-center justify-center gap-1.5 mb-1">
              <Star size={14} className="text-[#c9a84c]" />
              <span className="text-[10px] text-black/40 uppercase tracking-wider">{t('cabinet.rating')}</span>
            </div>
            <p className="text-2xl font-bold text-[#c9a84c]">{avgRating.toFixed(1)}</p>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2">
        <button
          type="button"
          onClick={() => setActiveTab('listings')}
          className={cn(
            'flex-1 py-2.5 rounded-xl text-xs font-bold border transition-all duration-200 flex items-center justify-center gap-1.5',
            activeTab === 'listings'
              ? 'bg-black text-white border-black'
              : 'bg-white/80 backdrop-blur-sm text-muted border-black/10 hover:border-black/20'
          )}
        >
          <FileText size={13} />
          {t('cabinet.my_listings')}
          {myListings.length > 0 && (
            <span className={cn(
              'rounded-full text-[9px] font-black px-1.5 py-0.5 min-w-[18px] text-center',
              activeTab === 'listings' ? 'bg-white/20 text-white' : 'bg-black/8 text-black/60'
            )}>
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
              ? 'bg-black text-white border-black'
              : 'bg-white/80 backdrop-blur-sm text-muted border-black/10 hover:border-black/20'
          )}
        >
          <MessageSquare size={13} />
          Мої відгуки
          {receivedReviews.length > 0 && (
            <span className={cn(
              'rounded-full text-[9px] font-black px-1.5 py-0.5 min-w-[18px] text-center',
              activeTab === 'reviews' ? 'bg-white/20 text-white' : 'bg-[#c9a84c]/15 text-[#c9a84c]'
            )}>
              {receivedReviews.length}
            </span>
          )}
        </button>
      </div>

      {/* Tab: My Listings */}
      {activeTab === 'listings' && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-display font-bold text-foreground">{t('cabinet.my_listings')}</h3>
            <button
              onClick={() => navigate('/add')}
              className="flex items-center gap-1.5 text-xs text-muted font-semibold hover:text-black"
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
                  listing.is_featured && 'featured-glow border-[#c9a84c]/30'
                )}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <h4 className="text-sm font-semibold text-foreground line-clamp-1">
                      {listing.title}
                    </h4>
                    <p className="text-xs text-muted mt-1 line-clamp-1">
                      {listing.description}
                    </p>
                  </div>
                  <StatusBadge status={listing.status} />
                </div>

                {listing.status === 'rejected' && listing.rejection_reason && (
                  <div className="flex items-start gap-2 bg-red-50 border border-red-200 rounded-xl p-3">
                    <AlertCircle size={14} className="text-red-500 shrink-0 mt-0.5" />
                    <div>
                      <p className="text-[10px] font-bold text-red-600">Причина відхилення:</p>
                      <p className="text-xs text-black/60 mt-0.5 leading-relaxed">{listing.rejection_reason}</p>
                    </div>
                  </div>
                )}

                {listing.status === 'pending' && (
                  <div className="flex items-center gap-2 bg-[#c9a84c]/6 border border-[#c9a84c]/20 rounded-xl px-3 py-2">
                    <Clock size={12} className="text-[#c9a84c] shrink-0" />
                    <p className="text-[10px] text-[#c9a84c]/80">На перевірці у модератора. Зазвичай 1–24 години.</p>
                  </div>
                )}

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    {listing.price !== null && (
                      <span className="text-sm font-bold text-[#c9a84c]">
                        {formatPrice(listing.price, listing.currency)}
                      </span>
                    )}
                    <StarRating rating={listing.rating_avg} size={12} />
                  </div>
                  <span className="text-[10px] text-black/30">
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
                    Відкрити
                  </button>
                  <button
                    onClick={() => handleDelete(listing.id)}
                    className="btn-ghost text-xs flex items-center gap-1 flex-1 justify-center text-red-500 border-red-200 hover:bg-red-50"
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
              <div className="px-4 pb-4">
                <button
                  onClick={() => navigate('/add')}
                  className="btn-primary py-2 px-4 text-xs w-full"
                >
                  {t('add_listing.title')}
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Tab: Received Reviews */}
      {activeTab === 'reviews' && (
        <div className="space-y-3">
          <h3 className="text-sm font-display font-bold text-foreground">Відгуки про мої послуги</h3>

          {receivedReviews.length > 0 ? (
            receivedReviews.map((rev) => {
              const sourceListing = listings.find((l) => l.id === rev.listing_id);
              return (
                <div key={rev.id} className="glass-panel p-4 space-y-3">
                  {sourceListing && (
                    <button
                      type="button"
                      onClick={() => navigate(`/listing/${sourceListing.id}`)}
                      className="flex items-center gap-1.5 text-[10px] text-muted font-semibold hover:text-black hover:underline"
                    >
                      <ChevronRight size={11} />
                      {sourceListing.title}
                    </button>
                  )}

                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-xs font-bold text-black/80">
                        {rev.profile?.first_name ?? 'Клієнт'}
                      </span>
                      {rev.profile?.username && (
                        <span className="text-[10px] text-black/30 ml-1.5">@{rev.profile.username}</span>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <StarRating rating={rev.rating} size={13} />
                      <span className="text-[10px] text-black/30">{timeAgo(rev.created_at, i18n.language)}</span>
                    </div>
                  </div>

                  {rev.comment && (
                    <p className="text-xs text-black/60 leading-relaxed font-medium italic">
                      "{rev.comment}"
                    </p>
                  )}

                  {rev.owner_reply && (
                    <div className="ml-3 pl-3 border-l-2 border-black/15 py-0.5">
                      <div className="flex items-center gap-1.5 mb-1">
                        <CornerDownRight size={10} className="text-muted" />
                        <span className="text-[9px] font-bold text-muted">Ваша відповідь</span>
                      </div>
                      <p className="text-[11px] text-black/50 leading-relaxed italic">{rev.owner_reply}</p>
                    </div>
                  )}

                  {!rev.owner_reply && (
                    <button
                      type="button"
                      onClick={() => navigate(`/listing/${rev.listing_id}`)}
                      className="text-[10px] text-muted font-bold hover:text-black hover:underline flex items-center gap-1"
                    >
                      <CornerDownRight size={10} />
                      Відповісти на відгук
                    </button>
                  )}
                </div>
              );
            })
          ) : (
            <div className="glass-panel">
              <EmptyState
                icon={MessageSquare}
                message="Поки немає опублікованих відгуків про ваші послуги."
                className="py-10"
              />
            </div>
          )}
        </div>
      )}
    </div>
  );
}
