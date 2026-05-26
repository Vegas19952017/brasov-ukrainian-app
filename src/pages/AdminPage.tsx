import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  CheckCircle, XCircle, Eye, Shield, UserCheck,
  Gem, Award, Search, Trash2, ShieldCheck, BarChart2,
  AlertTriangle, MessageSquare, X
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
          <Shield size={40} className="text-red-400 mx-auto opacity-50" />
          <p className="text-muted text-sm">{t('admin.access_denied')}</p>
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

  const openRejectModal = (id: string) => {
    setRejectModalId(id);
    setRejectReason('');
  };

  const handleConfirmReject = () => {
    if (!rejectModalId) return;
    rejectListing(rejectModalId, rejectReason.trim() || undefined);
    toast.success(t('admin.rejected_success'));
    setRejectModalId(null);
    setRejectReason('');
  };

  const handleToggleVerification = (id: string, current: boolean) => {
    setVerificationStatus(id, !current);
    toast.success(!current ? 'Спеціаліст верифікований!' : 'Верифікацію знято');
  };

  const handleSetPromo = (id: string, level: 'free' | 'basic' | 'premium') => {
    const days = level !== 'free' ? 30 : undefined;
    setPromotionLevel(id, level, days);
    toast.success(`Рівень просування змінено на ${level.toUpperCase()}`);
  };

  const handleDeleteListing = (id: string) => {
    if (window.confirm('Ви дійсно хочете видалити цю картку спеціаліста?')) {
      removeListing(id);
      toast.success('Картку видалено');
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
      {/* Rejection reason modal */}
      {rejectModalId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-fade-in">
          <div className="glass-panel p-5 w-full max-w-sm space-y-4 border border-red-200 shadow-2xl">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-red-500 font-bold text-sm">
                <XCircle size={16} />
                Відхилити заявку
              </div>
              <button
                type="button"
                onClick={() => setRejectModalId(null)}
                className="w-7 h-7 rounded-lg bg-black/5 border border-black/10 flex items-center justify-center text-muted hover:text-black"
              >
                <X size={14} />
              </button>
            </div>
            <div className="space-y-2">
              <label className="text-[10px] text-black/40 uppercase tracking-wider font-semibold block">
                Причина відхилення (видна спеціалісту)
              </label>
              <textarea
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                placeholder="Наприклад: недостатньо інформації, невірна категорія…"
                rows={3}
                className="input-glass text-xs resize-none"
              />
              <p className="text-[10px] text-black/30">Необов'язково, але допомагає спеціалісту виправити заявку.</p>
            </div>
            <div className="flex gap-2 pt-1">
              <button
                type="button"
                onClick={() => setRejectModalId(null)}
                className="flex-1 py-2.5 rounded-xl text-xs font-bold bg-white/80 backdrop-blur-sm border border-black/10 hover:bg-white/95 text-muted"
              >
                Скасувати
              </button>
              <button
                type="button"
                onClick={handleConfirmReject}
                className="flex-[2] flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-xs font-bold bg-red-50 text-red-500 border border-red-200 hover:bg-red-100"
              >
                <XCircle size={14} />
                Відхилити
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Admin header */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-[#c9a84c]/10 border border-[#c9a84c]/25 flex items-center justify-center">
          <Shield size={20} className="text-[#c9a84c]" />
        </div>
        <div>
          <h2 className="text-lg font-display font-bold text-foreground">{t('admin.title')}</h2>
          <p className="text-xs text-muted">
            Черга: {pendingListings.length} оголош. · {pendingProfiles.length} проф. · {pendingReviews.length} відг.
          </p>
        </div>
      </div>

      {/* Tabs navigation */}
      <div className="flex gap-1.5 overflow-x-auto pb-2 -mx-4 px-4 scrollbar-none">
        {(
          [
            ['listings_queue', `Модерація (${pendingListings.length})`],
            ['reviews', `Відгуки (${pendingReviews.length})`],
            ['complaints', `Скарги (${reviewComplaints.length})`],
            ['profiles', `Користувачі (${pendingProfiles.length})`],
            ['listings_mgmt', 'База спеціалістів'],
            ['analytics', 'Аналітика'],
          ] as [AdminTab, string][]
        ).map(([key, label]) => (
          <button
            key={key}
            type="button"
            onClick={() => setTab(key)}
            className={cn(
              'px-3.5 py-2 rounded-xl text-xs font-bold border shrink-0 transition-all duration-200',
              tab === key
                ? 'bg-black text-white border-black'
                : 'bg-white/80 backdrop-blur-sm text-muted border-black/10 hover:border-black/20'
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
              <div key={listing.id} className="glass-panel overflow-hidden">
                {listing.photos.length > 0 && (
                  <div className="relative w-full h-36 border-b border-black/7">
                    <img src={listing.photos[0]} alt={listing.title} className="w-full h-full object-cover" />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
                    <div className="absolute bottom-3 left-3">
                      <span className="badge-pending">{t('listing.status_pending')}</span>
                    </div>
                  </div>
                )}
                <div className="p-4 space-y-3">
                  <div>
                    <h4 className="text-sm font-semibold text-foreground">{listing.title}</h4>
                    <p className="text-xs text-muted mt-1 line-clamp-3 leading-relaxed">{listing.description}</p>
                  </div>
                  <div className="flex flex-wrap gap-1.5 text-[10px]">
                    {listing.languages?.map((l) => (
                      <span key={l} className="bg-black/5 border border-black/8 px-2 py-0.5 rounded text-muted">{l}</span>
                    ))}
                    {listing.districts?.slice(0, 2).map((d) => (
                      <span key={d} className="bg-black/6 border border-black/10 px-2 py-0.5 rounded text-black/60">{d}</span>
                    ))}
                    {listing.services?.slice(0, 2).map((s) => (
                      <span key={s} className="bg-[#c9a84c]/10 border border-[#c9a84c]/20 px-2 py-0.5 rounded text-[#c9a84c]">#{s}</span>
                    ))}
                  </div>
                  <div className="flex flex-wrap gap-2 text-xs text-black/30 pt-1 border-t border-black/7">
                    {listing.price !== null && (
                      <span className="text-[#c9a84c] font-bold">
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
                      className="btn-ghost text-xs flex items-center gap-1 flex-1 justify-center py-2"
                    >
                      <Eye size={14} />
                      <span>Переглянути</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => handleApproveListing(listing.id)}
                      className="flex-[2] flex items-center justify-center gap-1.5 py-2 rounded-xl text-xs font-bold bg-emerald-50 text-emerald-600 border border-emerald-200 hover:bg-emerald-100 transition-all"
                    >
                      <CheckCircle size={14} />
                      {t('admin.approve')}
                    </button>
                    <button
                      type="button"
                      onClick={() => openRejectModal(listing.id)}
                      className="flex-[2] flex items-center justify-center gap-1.5 py-2 rounded-xl text-xs font-bold bg-red-50 text-red-500 border border-red-200 hover:bg-red-100 transition-all"
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
            <CheckCircle size={28} className="text-emerald-500" />
            <p className="text-xs text-muted">{t('admin.no_pending')}</p>
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
                <div key={rev.id} className="glass-panel p-4 space-y-3">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-xs font-bold text-foreground">{rev.profile?.first_name || 'Клієнт'}</p>
                      <p className="text-[10px] text-muted">@{rev.profile?.username || rev.user_id}</p>
                    </div>
                    <StarRating rating={rev.rating} size={12} />
                  </div>
                  <div className="bg-black/3 p-3 rounded-xl border border-black/7">
                    <span className="text-[9px] text-black/30 uppercase block">До спеціаліста: {target?.title || 'Видалено'}</span>
                    <p className="text-xs text-black/70 mt-1 italic font-medium leading-relaxed">"{rev.comment}"</p>
                  </div>
                  <div className="flex gap-2 pt-1">
                    <button
                      type="button"
                      onClick={() => {
                        approveReview(rev.id);
                        toast.success('Відгук схвалено і опубліковано!');
                      }}
                      className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-xs font-bold bg-emerald-50 text-emerald-600 border border-emerald-200 hover:bg-emerald-100"
                    >
                      <CheckCircle size={14} />
                      Схвалити
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        rejectReview(rev.id);
                        toast.success('Відгук відхилено');
                      }}
                      className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-xs font-bold bg-red-50 text-red-500 border border-red-200 hover:bg-red-100"
                    >
                      <XCircle size={14} />
                      Відхилити
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="glass-panel py-16 flex flex-col items-center gap-3">
            <MessageSquare size={28} className="text-black/15" />
            <p className="text-xs text-muted">Немає відгуків на модерацію</p>
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
                <div key={comp.id} className="glass-panel p-4 space-y-3 border border-red-200 bg-red-50/30">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-red-500 font-bold text-xs">
                      <AlertTriangle size={14} />
                      <span>Скарга від користувача</span>
                    </div>
                    <span className="text-[9px] text-black/30">{timeAgo(comp.created_at, 'uk')}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-black/40 block">Причина скарги:</span>
                    <p className="text-xs text-foreground font-bold mt-0.5">{comp.reason}</p>
                  </div>
                  {review && (
                    <div className="bg-black/3 p-3 rounded-xl border border-black/7 space-y-1.5">
                      <div className="flex justify-between items-center text-[10px]">
                        <span className="text-black/40">Відгук від @{review.profile?.username || 'клієнт'}</span>
                        <StarRating rating={review.rating} size={10} />
                      </div>
                      <p className="text-xs text-black/60 italic">"{review.comment}"</p>
                      <span className="text-[9px] text-muted block">Спеціаліст: {target?.title || '—'}</span>
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
                        toast.success('Відгук видалено!');
                      }}
                      className="flex-1 py-2 rounded-xl text-xs font-bold bg-red-50 text-red-500 border border-red-200 hover:bg-red-100"
                    >
                      Видалити відгук
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        useStore.setState((s) => ({
                          reviewComplaints: s.reviewComplaints.filter((c) => c.id !== comp.id)
                        }));
                        toast.success('Скаргу відхилено');
                      }}
                      className="flex-1 py-2 rounded-xl text-xs font-bold bg-white/80 backdrop-blur-sm border border-black/10 hover:bg-white/95 text-muted"
                    >
                      Відхилити скаргу
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="glass-panel py-16 flex flex-col items-center gap-3">
            <ShieldCheck size={28} className="text-emerald-500" />
            <p className="text-xs text-muted">Скарг на відгуки немає. Все чисто!</p>
          </div>
        )
      )}

      {/* Tab 4: Profiles verification queue */}
      {tab === 'profiles' && (
        pendingProfiles.length > 0 ? (
          <div className="space-y-3">
            {pendingProfiles.map((p) => (
              <div key={p.id} className="glass-panel p-4 flex items-center justify-between gap-3 animate-slide-up">
                <div>
                  <p className="text-sm font-semibold text-foreground">{p.first_name}</p>
                  <p className="text-xs text-muted mt-0.5">@{p.username ?? p.id}</p>
                </div>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      approveProfile(p.id);
                      toast.success(t('admin.profile_approved'));
                    }}
                    className="px-3.5 py-2.5 rounded-xl text-xs font-bold bg-emerald-50 text-emerald-600 border border-emerald-200 hover:bg-emerald-100"
                    title="Схвалити"
                  >
                    <UserCheck size={14} />
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      rejectProfile(p.id);
                      toast.success(t('admin.profile_rejected'));
                    }}
                    className="px-3.5 py-2.5 rounded-xl text-xs font-bold bg-red-50 text-red-500 border border-red-200 hover:bg-red-100"
                    title="Відхилити"
                  >
                    <XCircle size={14} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="glass-panel py-12 text-center text-sm text-muted">
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
              placeholder="Пошук спеціалістів у базі…"
              className="input-glass py-3 pl-10 pr-4 text-xs"
            />
            <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted" />
          </div>

          <div className="space-y-3">
            {listings
              .filter((l) => l.title.toLowerCase().includes(mgmtSearch.toLowerCase()))
              .map((l) => {
                const isSpecVerified = l.is_verified;
                const specPromo = l.promotion_level || 'free';
                const promoExpiry = l.promotion_until
                  ? new Date(l.promotion_until).toLocaleDateString('uk-UA')
                  : null;
                return (
                  <div key={l.id} className="glass-panel p-4 space-y-3.5">
                    <div className="flex justify-between items-start">
                      <div>
                        <h4 className="text-xs font-bold text-foreground flex items-center gap-1.5">
                          {l.title}
                          {isSpecVerified && <CheckCircle size={12} className="text-emerald-500 shrink-0" />}
                        </h4>
                        <p className="text-[10px] text-muted mt-0.5">
                          @{l.telegram_username} · {t(`profile.status_${l.status}`)}
                        </p>
                      </div>
                      <div className="flex flex-col items-end gap-1">
                        {specPromo === 'premium' && (
                          <span className="text-[8px] font-bold text-[#c9a84c] bg-[#c9a84c]/10 border border-[#c9a84c]/20 rounded px-1.5 py-0.5">PREMIUM</span>
                        )}
                        {specPromo === 'basic' && (
                          <span className="text-[8px] font-bold text-black/60 bg-black/6 border border-black/10 rounded px-1.5 py-0.5">BASIC</span>
                        )}
                        {specPromo === 'free' && (
                          <span className="text-[8px] font-bold text-black/30 bg-black/4 border border-black/8 rounded px-1.5 py-0.5">FREE</span>
                        )}
                        {promoExpiry && specPromo !== 'free' && (
                          <span className="text-[9px] text-muted">до {promoExpiry}</span>
                        )}
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-[10px] text-muted pt-2.5 border-t border-black/7">
                      <div>
                        <span className="text-black/25">Мови:</span> {l.languages?.join(', ') || 'RU'}
                      </div>
                      <div>
                        <span className="text-black/25">Райони:</span> {l.districts?.length || 0} шт.
                      </div>
                    </div>

                    <div className="flex flex-wrap gap-1.5 pt-1">
                      <button
                        type="button"
                        onClick={() => handleToggleVerification(l.id, isSpecVerified)}
                        className={cn(
                          'px-2.5 py-1.5 rounded-lg border text-[9px] font-bold flex items-center gap-1 transition-all',
                          isSpecVerified
                            ? 'bg-emerald-50 text-emerald-600 border-emerald-200'
                            : 'bg-white/80 backdrop-blur-sm text-muted border-black/10 hover:bg-white/95'
                        )}
                      >
                        <ShieldCheck size={11} />
                        {isSpecVerified ? 'Зняти перевірку' : 'Верифікувати'}
                      </button>

                      <button
                        type="button"
                        onClick={() => handleSetPromo(l.id, specPromo === 'premium' ? 'free' : 'premium')}
                        className={cn(
                          'px-2.5 py-1.5 rounded-lg border text-[9px] font-bold flex items-center gap-1 transition-all',
                          specPromo === 'premium'
                            ? 'bg-[#c9a84c]/10 text-[#c9a84c] border-[#c9a84c]/25'
                            : 'bg-white/80 backdrop-blur-sm text-muted border-black/10 hover:bg-white/95'
                        )}
                      >
                        <Gem size={11} />
                        {specPromo === 'premium' ? 'Зняти Преміум' : 'Зробити Преміум'}
                      </button>

                      <button
                        type="button"
                        onClick={() => handleSetPromo(l.id, specPromo === 'basic' ? 'free' : 'basic')}
                        className={cn(
                          'px-2.5 py-1.5 rounded-lg border text-[9px] font-bold flex items-center gap-1 transition-all',
                          specPromo === 'basic'
                            ? 'bg-black/8 text-black/70 border-black/15'
                            : 'bg-white/80 backdrop-blur-sm text-muted border-black/10 hover:bg-white/95'
                        )}
                      >
                        <Award size={11} />
                        {specPromo === 'basic' ? 'Зняти Базовий' : 'Зробити Базовим'}
                      </button>

                      <button
                        type="button"
                        onClick={() => handleDeleteListing(l.id)}
                        className="px-2.5 py-1.5 rounded-lg border text-[9px] font-bold bg-red-50 text-red-500 border-red-200 hover:bg-red-100 ml-auto flex items-center gap-1"
                      >
                        <Trash2 size={11} />
                        Видалити
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
              <span className="text-[9px] text-black/40 uppercase tracking-wider block mb-1">Перегляди</span>
              <span className="text-xl font-black text-foreground">{totalViews}</span>
            </div>
            <div className="glass-panel p-3 text-center">
              <span className="text-[9px] text-black/40 uppercase tracking-wider block mb-1">Кліки</span>
              <span className="text-xl font-black text-[#c9a84c]">{totalClicks}</span>
            </div>
            <div className="glass-panel p-3 text-center">
              <span className="text-[9px] text-black/40 uppercase tracking-wider block mb-1">CTR</span>
              <span className="text-xl font-black text-emerald-600">{totalCTR.toFixed(1)}%</span>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-2">
            {(['premium', 'basic', 'free'] as const).map((level) => {
              const count = listings.filter((l) => l.promotion_level === level && l.status === 'approved').length;
              const styles = {
                premium: 'text-[#c9a84c] border-[#c9a84c]/25',
                basic: 'text-black/60 border-black/12',
                free: 'text-muted border-black/8',
              };
              return (
                <div key={level} className={cn('glass-panel p-3 text-center border', styles[level])}>
                  <span className="text-[9px] uppercase tracking-wider block mb-1 opacity-70">{level}</span>
                  <span className="text-xl font-black">{count}</span>
                </div>
              );
            })}
          </div>

          <div className="glass-panel p-4 space-y-3.5">
            <h3 className="text-xs font-bold text-black/30 uppercase tracking-wider flex items-center gap-1.5">
              <BarChart2 size={14} className="text-muted" />
              Статистика по спеціалістах
            </h3>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="text-[9px] text-black/30 uppercase font-semibold">
                    <th className="pb-2 font-semibold">Спеціаліст</th>
                    <th className="pb-2 text-center font-semibold">Перегляди</th>
                    <th className="pb-2 text-center font-semibold">Кліки</th>
                    <th className="pb-2 text-right font-semibold">CTR</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-black/5 text-[11px] text-black/70">
                  {listingAnalytics
                    .sort((a, b) => b.views - a.views)
                    .map((item) => (
                      <tr key={item.id}>
                        <td className="py-2.5 font-bold truncate max-w-[120px] pr-2">{item.title}</td>
                        <td className="py-2.5 text-center font-bold text-black/60">{item.views}</td>
                        <td className="py-2.5 text-center font-bold text-[#c9a84c]">{item.clicks}</td>
                        <td className="py-2.5 text-right font-extrabold text-emerald-600">{item.ctr.toFixed(1)}%</td>
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
