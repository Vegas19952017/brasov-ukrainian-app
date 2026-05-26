import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  CheckCircle, XCircle, Clock, Eye, Shield, UserCheck,
  Star, Gem, Award, Search, Trash2, ShieldCheck, BarChart2,
  AlertTriangle, MessageSquare, RefreshCw, Smartphone, X
} from 'lucide-react';
import { useStore } from '../store';
import { cn, formatPrice, timeAgo } from '../lib/utils';
import toast from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';
import StarRating from '../components/StarRating';

type AdminTab = 'listings_queue' | 'listings_mgmt' | 'profiles' | 'reviews' | 'complaints' | 'analytics';

export default function AdminPage() {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const [tab, setTab] = useState<AdminTab>('listings_queue');
  const [mgmtSearch, setMgmtSearch] = useState('');

  // NEW: rejection modal state
  const [rejectModalId, setRejectModalId] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState('');

  const {
    profile,
    listings,
    profiles,
    reviews,
    reviewComplaints,
    analyticsEvents,
    updateListing,
    rejectListing,
    approveProfile,
    rejectProfile,
    approveReview,
    rejectReview,
    setPromotionLevel,
    setVerificationStatus,
    removeListing
  } = useStore();

  if (!profile || profile.role !== 'admin') {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="glass-panel p-8 text-center space-y-3">
          <Shield size={40} className="text-crimson-light mx-auto opacity-50" />
          <p className="text-white/40 text-sm">{t('admin.access_denied')}</p>
        </div>
      </div>
    );
  }

  const pendingListings = listings.filter((l) => l.status === 'pending');
  const pendingProfiles = profiles.filter((p) => p.status === 'pending' && p.role !== 'admin');
  const pendingReviews = reviews.filter((r) => r.status === 'pending');

  const handleApproveListing = (id: string) => {
    updateListing(id, { status: 'approved' });
    toast.success(t('admin.approved_success'));
  };

  // NEW: open rejection modal for listing
  const openRejectModal = (id: string) => {
    setRejectModalId(id);
    setRejectReason('');
  };

  // NEW: confirm rejection with reason
  const handleConfirmReject = () => {
    if (!rejectModalId) return;
    rejectListing(rejectModalId, rejectReason.trim() || undefined);
    toast.success(t('admin.rejected_success'));
    setRejectModalId(null);
    setRejectReason('');
  };

  const handleToggleVerification = (id: string, current: boolean) => {
    setVerificationStatus(id, !current);
    toast.success(!current ? 'Специалист верифицирован!' : 'Верификация снята');
  };

  const handleSetPromo = (id: string, level: 'free' | 'basic' | 'premium') => {
    const days = level !== 'free' ? 30 : undefined;
    setPromotionLevel(id, level, days);
    toast.success(`Уровень продвижения изменен на ${level.toUpperCase()}`);
  };

  const handleDeleteListing = (id: string) => {
    if (window.confirm('Вы действительно хотите удалить эту карточку специалиста?')) {
      removeListing(id);
      toast.success('Карточка удалена');
    }
  };

  const totalViews = analyticsEvents.filter((e) => e.event_type === 'view').length;
  const totalClicks = analyticsEvents.filter((e) => e.event_type === 'click_contact').length;
  const totalCTR = totalViews > 0 ? (totalClicks / totalViews) * 100 : 0;

  const listingAnalytics = listings.map((l) => {
    const views = analyticsEvents.filter((e) => e.listing_id === l.id && e.event_type === 'view').length;
    const clicks = analyticsEvents.filter((e) => e.listing_id === l.id && e.event_type === 'click_contact').length;
    const ctr = views > 0 ? (clicks / views) * 100 : 0;
    return { ...l, views, clicks, ctr };
  });

  return (
    <div className="px-4 py-5 space-y-5 animate-fade-in pb-16">
      {/* NEW: Rejection reason modal */}
      {rejectModalId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fade-in">
          <div className="glass-panel p-5 w-full max-w-sm space-y-4 border border-crimson/30 shadow-2xl">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-crimson-light font-bold text-sm">
                <XCircle size={16} />
                Отклонить заявку
              </div>
              <button
                type="button"
                onClick={() => setRejectModalId(null)}
                className="w-7 h-7 rounded-lg bg-white/5 border border-glass-border flex items-center justify-center text-white/40 hover:text-white"
              >
                <X size={14} />
              </button>
            </div>
            <div className="space-y-2">
              <label className="text-[10px] text-white/40 uppercase tracking-wider font-semibold block">
                Причина отклонения (видна специалисту)
              </label>
              <textarea
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                placeholder="Например: недостаточно информации, неверная категория…"
                rows={3}
                className="input-glass text-xs resize-none"
              />
              <p className="text-[10px] text-white/30">Необязательно, но помогает специалисту исправить заявку.</p>
            </div>
            <div className="flex gap-2 pt-1">
              <button
                type="button"
                onClick={() => setRejectModalId(null)}
                className="flex-1 py-2.5 rounded-xl text-xs font-bold bg-white/5 border border-glass-border hover:bg-glass-hover text-white/60"
              >
                Отмена
              </button>
              <button
                type="button"
                onClick={handleConfirmReject}
                className="flex-[2] flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-xs font-bold bg-crimson/15 text-crimson-light border border-crimson/30 hover:bg-crimson/25"
              >
                <XCircle size={14} />
                Отклонить
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Admin header */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-amber/15 border border-amber/30 flex items-center justify-center shadow-blue-glow">
          <Shield size={20} className="text-amber animate-pulse" />
        </div>
        <div>
          <h2 className="text-lg font-display font-bold text-white">{t('admin.title')}</h2>
          <p className="text-xs text-white/40">
            Очередь: {pendingListings.length} объявл. · {pendingProfiles.length} проф. · {pendingReviews.length} отзыв.
          </p>
        </div>
      </div>

      {/* Tabs navigation */}
      <div className="flex gap-1.5 overflow-x-auto pb-2 -mx-4 px-4 scrollbar-none">
        {(
          [
            ['listings_queue', `Модерация (${pendingListings.length})`],
            ['reviews', `Отзывы (${pendingReviews.length})`],
            ['complaints', `Жалобы (${reviewComplaints.length})`],
            ['profiles', `Пользователи (${pendingProfiles.length})`],
            ['listings_mgmt', 'База специалистов'],
            ['analytics', 'Аналитика'],
          ] as [AdminTab, string][]
        ).map(([key, label]) => (
          <button
            key={key}
            type="button"
            onClick={() => setTab(key)}
            className={cn(
              'px-3.5 py-2 rounded-xl text-xs font-bold border shrink-0 transition-all duration-200',
              tab === key
                ? 'bg-royal/20 text-royal-light border-royal/40'
                : 'bg-obsidian-800/20 border-glass-border text-white/40'
            )}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Tab 1: Listings moderation queue */}
      {tab === 'listings_queue' && (
        pendingListings.length > 0 ? (
          <div className="space-y-4">
            {pendingListings.map((listing) => (
              <div key={listing.id} className="glass-panel overflow-hidden border border-glass-border">
                {listing.photos.length > 0 && (
                  <div className="relative w-full h-36 border-b border-glass-border">
                    <img src={listing.photos[0]} alt={listing.title} className="w-full h-full object-cover" />
                    <div className="absolute inset-0 bg-gradient-to-t from-obsidian/90 to-transparent" />
                    <div className="absolute bottom-3 left-3">
                      <span className="badge-pending">{t('listing.status_pending')}</span>
                    </div>
                  </div>
                )}
                <div className="p-4 space-y-3">
                  <div>
                    <h4 className="text-sm font-semibold text-white">{listing.title}</h4>
                    <p className="text-xs text-white/45 mt-1 line-clamp-3 leading-relaxed">{listing.description}</p>
                  </div>
                  {/* Specialist details preview */}
                  <div className="flex flex-wrap gap-1.5 text-[10px]">
                    {listing.languages?.map((l) => (
                      <span key={l} className="bg-white/5 border border-glass-border px-2 py-0.5 rounded text-white/50">{l}</span>
                    ))}
                    {listing.districts?.slice(0, 2).map((d) => (
                      <span key={d} className="bg-royal/10 border border-royal/20 px-2 py-0.5 rounded text-royal-light">{d}</span>
                    ))}
                    {listing.services?.slice(0, 2).map((s) => (
                      <span key={s} className="bg-amber/10 border border-amber/20 px-2 py-0.5 rounded text-amber">#{s}</span>
                    ))}
                  </div>
                  <div className="flex flex-wrap gap-2 text-xs text-white/30 pt-1 border-t border-white/5">
                    {listing.price !== null && (
                      <span className="text-amber font-bold">
                        {formatPrice(listing.price, listing.currency)}
                      </span>
                    )}
                    <span>@{listing.telegram_username}</span>
                    <span>{timeAgo(listing.created_at, i18n.language)}</span>
                  </div>
                  <div className="flex gap-2 pt-2">
                    <button
                      type="button"
                      onClick={() => navigate(`/listing/${listing.id}`)}
                      className="btn-ghost text-xs flex items-center gap-1 flex-1 justify-center py-2 border border-glass-border rounded-xl"
                    >
                      <Eye size={14} />
                      <span>Смотреть</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => handleApproveListing(listing.id)}
                      className="flex-[2] flex items-center justify-center gap-1.5 py-2 rounded-xl text-xs font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 hover:bg-emerald-500/20 transition-all"
                    >
                      <CheckCircle size={14} />
                      {t('admin.approve')}
                    </button>
                    {/* NEW: reject opens modal with reason input */}
                    <button
                      type="button"
                      onClick={() => openRejectModal(listing.id)}
                      className="flex-[2] flex items-center justify-center gap-1.5 py-2 rounded-xl text-xs font-bold bg-crimson/10 text-crimson-light border border-crimson/30 hover:bg-crimson/20 transition-all"
                    >
                      <XCircle size={14} />
                      {t('admin.reject')}
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="glass-panel py-16 flex flex-col items-center gap-3">
            <CheckCircle size={28} className="text-emerald-400" />
            <p className="text-xs text-white/40">{t('admin.no_pending')}</p>
          </div>
        )
      )}

      {/* Tab 2: Reviews moderation queue */}
      {tab === 'reviews' && (
        pendingReviews.length > 0 ? (
          <div className="space-y-3">
            {pendingReviews.map((rev) => {
              const target = listings.find((l) => l.id === rev.listing_id);
              return (
                <div key={rev.id} className="glass-panel p-4 space-y-3 border border-glass-border">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-xs font-bold text-white">{rev.profile?.first_name || 'Клиент'}</p>
                      <p className="text-[10px] text-white/40">@{rev.profile?.username || rev.user_id}</p>
                    </div>
                    <StarRating rating={rev.rating} size={12} />
                  </div>
                  <div className="bg-obsidian-900/50 p-3 rounded-xl border border-glass-border">
                    <span className="text-[9px] text-white/30 uppercase block">К специалисту: {target?.title || 'Удален'}</span>
                    <p className="text-xs text-white/70 mt-1 italic font-medium leading-relaxed">"{rev.comment}"</p>
                  </div>
                  <div className="flex gap-2 pt-1">
                    <button
                      type="button"
                      onClick={() => {
                        approveReview(rev.id);
                        toast.success('Отзыв одобрен и опубликован!');
                      }}
                      className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-xs font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 hover:bg-emerald-500/20"
                    >
                      <CheckCircle size={14} />
                      Одобрить
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        rejectReview(rev.id);
                        toast.success('Отзыв отклонен');
                      }}
                      className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-xs font-bold bg-crimson/10 text-crimson-light border border-crimson/30 hover:bg-crimson/20"
                    >
                      <XCircle size={14} />
                      Отклонить
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="glass-panel py-16 flex flex-col items-center gap-3">
            <MessageSquare size={28} className="text-white/20" />
            <p className="text-xs text-white/40">Нет отзывов на модерацию</p>
          </div>
        )
      )}

      {/* Tab 3: Complaints queue */}
      {tab === 'complaints' && (
        reviewComplaints.length > 0 ? (
          <div className="space-y-3">
            {reviewComplaints.map((comp) => {
              const review = reviews.find((r) => r.id === comp.review_id);
              const target = review ? listings.find((l) => l.id === review.listing_id) : null;
              return (
                <div key={comp.id} className="glass-panel p-4 space-y-3 border border-crimson/20 bg-crimson/5">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-crimson-light font-bold text-xs">
                      <AlertTriangle size={14} />
                      <span>Жалоба от пользователя</span>
                    </div>
                    <span className="text-[9px] text-white/30">{timeAgo(comp.created_at, 'uk')}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-white/40 block">Причина жалобы:</span>
                    <p className="text-xs text-white/90 font-bold mt-0.5">{comp.reason}</p>
                  </div>
                  {review && (
                    <div className="bg-obsidian-900/60 p-3 rounded-xl border border-glass-border space-y-1.5">
                      <div className="flex justify-between items-center text-[10px]">
                        <span className="text-white/40">Отзыв от @{review.profile?.username || 'клиент'}</span>
                        <StarRating rating={review.rating} size={10} />
                      </div>
                      <p className="text-xs text-white/60 italic">"{review.comment}"</p>
                      <span className="text-[9px] text-royal-light block">Специалист: {target?.title || '—'}</span>
                    </div>
                  )}
                  <div className="flex gap-2 pt-1">
                    <button
                      type="button"
                      onClick={() => {
                        rejectReview(comp.review_id);
                        useStore.setState((s) => ({
                          reviewComplaints: s.reviewComplaints.filter((c) => c.id !== comp.id)
                        }));
                        toast.success('Отзыв удален!');
                      }}
                      className="flex-1 py-2 rounded-xl text-xs font-bold bg-crimson/15 text-crimson-light border border-crimson/30 hover:bg-crimson/25"
                    >
                      Удалить отзыв
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        useStore.setState((s) => ({
                          reviewComplaints: s.reviewComplaints.filter((c) => c.id !== comp.id)
                        }));
                        toast.success('Жалоба отклонена');
                      }}
                      className="flex-1 py-2 rounded-xl text-xs font-bold bg-white/5 border border-glass-border hover:bg-glass-hover text-white/70"
                    >
                      Отклонить жалобу
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="glass-panel py-16 flex flex-col items-center gap-3">
            <ShieldCheck size={28} className="text-emerald-400" />
            <p className="text-xs text-white/40">Жалоб на отзывы нет. Все чисто!</p>
          </div>
        )
      )}

      {/* Tab 4: Profiles verification queue */}
      {tab === 'profiles' && (
        pendingProfiles.length > 0 ? (
          <div className="space-y-3">
            {pendingProfiles.map((p) => (
              <div key={p.id} className="glass-panel p-4 flex items-center justify-between gap-3 border border-glass-border animate-slide-up">
                <div>
                  <p className="text-sm font-semibold text-white">{p.first_name}</p>
                  <p className="text-xs text-white/40 mt-0.5">@{p.username ?? p.id}</p>
                </div>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      approveProfile(p.id);
                      toast.success(t('admin.profile_approved'));
                    }}
                    className="px-3.5 py-2.5 rounded-xl text-xs font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 hover:bg-emerald-500/20"
                    title="Одобрить"
                  >
                    <UserCheck size={14} />
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      rejectProfile(p.id);
                      toast.success(t('admin.profile_rejected'));
                    }}
                    className="px-3.5 py-2.5 rounded-xl text-xs font-bold bg-crimson/10 text-crimson-light border border-crimson/30 hover:bg-crimson/20"
                    title="Отклонить"
                  >
                    <XCircle size={14} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="glass-panel py-12 text-center text-sm text-white/40">
            {t('admin.no_pending_profiles')}
          </div>
        )
      )}

      {/* Tab 5: Listings Management */}
      {tab === 'listings_mgmt' && (
        <div className="space-y-4">
          <div className="relative">
            <input
              type="text"
              value={mgmtSearch}
              onChange={(e) => setMgmtSearch(e.target.value)}
              placeholder="Поиск специалистов в базе…"
              className="input-glass py-3 pl-10 pr-4 text-xs"
            />
            <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-white/30" />
          </div>

          <div className="space-y-3">
            {listings
              .filter((l) => l.title.toLowerCase().includes(mgmtSearch.toLowerCase()))
              .map((l) => {
                const isSpecVerified = l.is_verified;
                const specPromo = l.promotion_level || 'free';
                // Show promotion expiry if set
                const promoExpiry = l.promotion_until
                  ? new Date(l.promotion_until).toLocaleDateString('ru-RU')
                  : null;
                return (
                  <div key={l.id} className="glass-panel p-4 space-y-3.5 border border-glass-border">
                    <div className="flex justify-between items-start">
                      <div>
                        <h4 className="text-xs font-bold text-white flex items-center gap-1.5">
                          {l.title}
                          {isSpecVerified && <CheckCircle size={12} className="text-emerald-400 shrink-0" />}
                        </h4>
                        <p className="text-[10px] text-white/40 mt-0.5">
                          @{l.telegram_username} · {t(`profile.status_${l.status}`)}
                        </p>
                      </div>
                      <div className="flex flex-col items-end gap-1">
                        {specPromo === 'premium' && (
                          <span className="text-[8px] font-bold text-amber bg-amber/10 border border-amber/20 rounded px-1.5 py-0.5">PREMIUM</span>
                        )}
                        {specPromo === 'basic' && (
                          <span className="text-[8px] font-bold text-royal-light bg-royal/10 border border-royal/20 rounded px-1.5 py-0.5">BASIC</span>
                        )}
                        {specPromo === 'free' && (
                          <span className="text-[8px] font-bold text-white/30 bg-white/5 border border-glass-border rounded px-1.5 py-0.5">FREE</span>
                        )}
                        {/* NEW: show promotion expiry date */}
                        {promoExpiry && specPromo !== 'free' && (
                          <span className="text-[9px] text-white/30">до {promoExpiry}</span>
                        )}
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-[10px] text-white/50 pt-2.5 border-t border-white/5">
                      <div>
                        <span className="text-white/20">Языки:</span> {l.languages?.join(', ') || 'RU'}
                      </div>
                      <div>
                        <span className="text-white/20">Районы:</span> {l.districts?.length || 0} шт.
                      </div>
                    </div>

                    <div className="flex flex-wrap gap-1.5 pt-1">
                      <button
                        type="button"
                        onClick={() => handleToggleVerification(l.id, isSpecVerified)}
                        className={cn(
                          'px-2.5 py-1.5 rounded-lg border text-[9px] font-bold flex items-center gap-1 transition-all',
                          isSpecVerified
                            ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                            : 'bg-white/5 text-white/50 border-glass-border hover:bg-glass-hover'
                        )}
                      >
                        <ShieldCheck size={11} />
                        {isSpecVerified ? 'Снять проверку' : 'Верифицировать'}
                      </button>

                      <button
                        type="button"
                        onClick={() => handleSetPromo(l.id, specPromo === 'premium' ? 'free' : 'premium')}
                        className={cn(
                          'px-2.5 py-1.5 rounded-lg border text-[9px] font-bold flex items-center gap-1 transition-all',
                          specPromo === 'premium'
                            ? 'bg-amber/10 text-amber border-amber/20'
                            : 'bg-white/5 text-white/50 border-glass-border hover:bg-glass-hover'
                        )}
                      >
                        <Gem size={11} />
                        {specPromo === 'premium' ? 'Снять Премиум' : 'Сделать Премиум'}
                      </button>

                      <button
                        type="button"
                        onClick={() => handleSetPromo(l.id, specPromo === 'basic' ? 'free' : 'basic')}
                        className={cn(
                          'px-2.5 py-1.5 rounded-lg border text-[9px] font-bold flex items-center gap-1 transition-all',
                          specPromo === 'basic'
                            ? 'bg-royal/10 text-royal-light border-royal/20'
                            : 'bg-white/5 text-white/50 border-glass-border hover:bg-glass-hover'
                        )}
                      >
                        <Award size={11} />
                        {specPromo === 'basic' ? 'Снять Базовый' : 'Сделать Базовым'}
                      </button>

                      <button
                        type="button"
                        onClick={() => handleDeleteListing(l.id)}
                        className="px-2.5 py-1.5 rounded-lg border text-[9px] font-bold bg-crimson/10 text-crimson-light border-crimson/20 hover:bg-crimson/25 ml-auto flex items-center gap-1"
                      >
                        <Trash2 size={11} />
                        Удалить
                      </button>
                    </div>
                  </div>
                );
              })}
          </div>
        </div>
      )}

      {/* Tab 6: Analytics Dashboard */}
      {tab === 'analytics' && (
        <div className="space-y-4">
          <div className="grid grid-cols-3 gap-2">
            <div className="glass-panel p-3 text-center">
              <span className="text-[9px] text-white/40 uppercase tracking-wider block mb-1">Просмотры</span>
              <span className="text-xl font-black text-royal-light">{totalViews}</span>
            </div>
            <div className="glass-panel p-3 text-center">
              <span className="text-[9px] text-white/40 uppercase tracking-wider block mb-1">Клики</span>
              <span className="text-xl font-black text-amber">{totalClicks}</span>
            </div>
            <div className="glass-panel p-3 text-center">
              <span className="text-[9px] text-white/40 uppercase tracking-wider block mb-1">CTR</span>
              <span className="text-xl font-black text-emerald-400">{totalCTR.toFixed(1)}%</span>
            </div>
          </div>

          {/* Totals by promo level */}
          <div className="grid grid-cols-3 gap-2">
            {(['premium', 'basic', 'free'] as const).map((level) => {
              const count = listings.filter((l) => l.promotion_level === level && l.status === 'approved').length;
              const colors = {
                premium: 'text-amber border-amber/30',
                basic: 'text-royal-light border-royal/30',
                free: 'text-white/40 border-glass-border',
              };
              return (
                <div key={level} className={cn('glass-panel p-3 text-center border', colors[level])}>
                  <span className="text-[9px] uppercase tracking-wider block mb-1 opacity-70">{level}</span>
                  <span className="text-xl font-black">{count}</span>
                </div>
              );
            })}
          </div>

          <div className="glass-panel p-4 space-y-3.5 border border-glass-border">
            <h3 className="text-xs font-bold text-white/30 uppercase tracking-wider flex items-center gap-1.5">
              <BarChart2 size={14} className="text-royal-light" />
              Статистика по специалистам
            </h3>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="text-[9px] text-white/30 uppercase font-semibold">
                    <th className="pb-2 font-semibold">Специалист</th>
                    <th className="pb-2 text-center font-semibold">Просмотры</th>
                    <th className="pb-2 text-center font-semibold">Клики</th>
                    <th className="pb-2 text-right font-semibold">CTR</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-glass-border/30 text-[11px] text-white/70">
                  {listingAnalytics
                    .sort((a, b) => b.views - a.views)
                    .map((item) => (
                      <tr key={item.id}>
                        <td className="py-2.5 font-bold truncate max-w-[120px] pr-2">{item.title}</td>
                        <td className="py-2.5 text-center font-bold text-royal-light">{item.views}</td>
                        <td className="py-2.5 text-center font-bold text-amber">{item.clicks}</td>
                        <td className="py-2.5 text-right font-extrabold text-emerald-400">{item.ctr.toFixed(1)}%</td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
