import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  ArrowLeft, MapPin, MessageCircle, Clock, ArrowRight,
  ShieldAlert, Gem, Send, ExternalLink, ChevronLeft, ChevronRight, MessageSquare,
  CheckCircle, Award, Phone, Languages, HelpCircle, CornerDownRight, AlertTriangle
} from 'lucide-react';
import EmptyState from '../components/ui/EmptyState';
import { useStore } from '../store';
import toast from 'react-hot-toast';
import { cn, formatPrice, timeAgo, getLocalizedName } from '../lib/utils';
import StarRating from '../components/StarRating';

export default function ListingDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { t, i18n } = useTranslation();
  const {
    listings,
    categories,
    profile,
    isListingBlacklisted,
    getReviewsForListing,
    addReview,
    addReviewReply,
    submitReviewComplaint,
    logAnalyticsEvent
  } = useStore();

  const [currentPhoto, setCurrentPhoto] = useState(0);
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewComment, setReviewComment] = useState('');
  const [replyTexts, setReplyTexts] = useState<Record<string, string>>({});
  const [activeReplyBox, setActiveReplyBox] = useState<string | null>(null);

  const listing = listings.find((l) => l.id === id);

  useEffect(() => {
    if (listing) {
      logAnalyticsEvent(listing.id, 'view');
    }
  }, [id, listing, logAnalyticsEvent]);

  if (!listing) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <p className="text-muted">{t('common.error')}</p>
      </div>
    );
  }

  const category = categories.find((c) => c.id === listing.category_id);
  const isBlacklisted = isListingBlacklisted(listing);
  const reviews = getReviewsForListing(listing.id);

  const visibleReviews = reviews.filter(
    (r) => r.status === 'approved' || (profile && r.user_id === profile.id)
  );

  const userReview = profile
    ? reviews.find((r) => r.user_id === profile.id)
    : undefined;

  const isCarpooling = listing.departure_date !== null;
  const isOwner = profile?.id === listing.user_id;

  const nextPhoto = () => {
    if (listing.photos.length > 0) {
      setCurrentPhoto((prev) => (prev + 1) % listing.photos.length);
    }
  };
  const prevPhoto = () => {
    if (listing.photos.length > 0) {
      setCurrentPhoto((prev) => (prev - 1 + listing.photos.length) % listing.photos.length);
    }
  };

  const handleContactClick = (type: 'telegram' | 'phone') => {
    logAnalyticsEvent(listing.id, 'click_contact');
    window.Telegram?.WebApp?.HapticFeedback?.impactOccurred('medium');
  };

  const handleReportReview = (reviewId: string) => {
    if (!profile) {
      toast.error(t('chat.auth_required'));
      return;
    }
    const reason = window.prompt('Вкажіть причину скарги на відгук:');
    if (reason && reason.trim()) {
      submitReviewComplaint(reviewId, profile.id, reason.trim());
      toast.success('Скарга надіслана модератору!');
    }
  };

  const handleSendReply = (reviewId: string) => {
    const text = replyTexts[reviewId];
    if (!text || !text.trim()) return;
    addReviewReply(reviewId, text);
    setReplyTexts((prev) => ({ ...prev, [reviewId]: '' }));
    setActiveReplyBox(null);
    toast.success('Відповідь опубліковано!');
  };

  const promoLevel = listing.promotion_level || 'free';
  const isPremium = promoLevel === 'premium';
  const isBasic = promoLevel === 'basic';

  return (
    <div className="animate-fade-in pb-12">
      {/* Photo carousel */}
      {listing.photos.length > 0 ? (
        <div className="relative w-full aspect-[4/3] bg-black/5 border-b border-black/7">
          <img
            src={listing.photos[currentPhoto]}
            alt={listing.title}
            className="w-full h-full object-cover"
          />

          {/* Gradient overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/30 via-transparent to-black/10" />

          {/* Navigation arrows */}
          {listing.photos.length > 1 && (
            <>
              <button
                onClick={prevPhoto}
                className="absolute left-3 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-black/50 backdrop-blur-sm flex items-center justify-center text-white/80 hover:text-white transition-colors"
              >
                <ChevronLeft size={18} />
              </button>
              <button
                onClick={nextPhoto}
                className="absolute right-3 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-black/50 backdrop-blur-sm flex items-center justify-center text-white/80 hover:text-white transition-colors"
              >
                <ChevronRight size={18} />
              </button>

              {/* Dots */}
              <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-1.5">
                {listing.photos.map((_, i) => (
                  <button
                    key={i}
                    onClick={() => setCurrentPhoto(i)}
                    className={cn(
                      'w-2 h-2 rounded-full transition-all duration-200',
                      i === currentPhoto
                        ? 'bg-[#c9a84c] w-5'
                        : 'bg-white/50 hover:bg-white/70'
                    )}
                  />
                ))}
              </div>
            </>
          )}

          {/* Back button */}
          <button
            onClick={() => navigate(-1)}
            className="absolute top-4 left-4 w-9 h-9 rounded-xl bg-black/50 backdrop-blur-sm flex items-center justify-center text-white/80 hover:text-white transition-colors border border-white/10"
          >
            <ArrowLeft size={18} />
          </button>

          {/* Featured/Basic badge */}
          {isPremium && (
            <div className="absolute top-4 right-4 flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#c9a84c]/20 backdrop-blur-sm border border-[#c9a84c]/40">
              <Gem size={12} className="text-[#c9a84c] animate-pulse" />
              <span className="text-[10px] font-bold text-[#c9a84c] tracking-wider uppercase">{t('listing.featured')}</span>
            </div>
          )}
          {isBasic && (
            <div className="absolute top-4 right-4 flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-black/40 backdrop-blur-sm border border-white/20">
              <Award size={12} className="text-white" />
              <span className="text-[10px] font-bold text-white tracking-wider uppercase">Standard</span>
            </div>
          )}
        </div>
      ) : (
        <div className="px-4 pt-4">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center gap-2 text-muted hover:text-black transition-colors mb-4"
          >
            <ArrowLeft size={18} />
            <span className="text-sm">{t('common.back')}</span>
          </button>
        </div>
      )}

      {/* Content */}
      <div className="px-4 mt-4 space-y-4">
        {/* Blacklist warning */}
        {isBlacklisted && (
          <div className="flex items-start gap-3 bg-red-50 border border-red-200 rounded-xl p-4 animate-slide-up">
            <ShieldAlert size={20} className="text-red-500 shrink-0 mt-0.5" />
            <p className="text-sm font-semibold text-red-600">
              {t('listing.blacklist_warning')}
            </p>
          </div>
        )}

        {/* Title & Category & Verification */}
        <div className="glass-panel p-5 relative overflow-hidden">
          {isPremium && <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-[#c9a84c] via-yellow-300 to-[#c9a84c]" />}
          <div className="flex items-center justify-between">
            {category && (
              <span className="text-[10px] text-black/60 font-bold uppercase tracking-wider bg-black/6 px-2 py-0.5 rounded-md border border-black/8">
                {getLocalizedName(category, i18n.language)}
              </span>
            )}
            {listing.is_verified && (
              <div className="flex items-center gap-1 text-[10px] text-emerald-600 font-bold bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 rounded-md">
                <CheckCircle size={12} />
                <span>Перевірено</span>
              </div>
            )}
          </div>
          <h1 className="text-xl font-display font-bold text-foreground mt-3 leading-snug">
            {listing.title}
          </h1>
          <div className="flex items-center gap-3 mt-3">
            <StarRating rating={listing.rating_avg} size={16} />
            <span className="text-xs text-black/20">•</span>
            <span className="text-xs text-muted font-medium">
              {timeAgo(listing.created_at, i18n.language)}
            </span>
          </div>
        </div>

        {/* Price & Location */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {listing.price !== null && (
            <div className="glass-panel px-4 py-4 flex items-center justify-between">
              <span className="text-xs text-black/40 font-semibold uppercase tracking-wider">{t('listing.price')}</span>
              <span className="text-lg font-extrabold text-[#c9a84c]">
                {formatPrice(listing.price, listing.currency)}
              </span>
            </div>
          )}
          {listing.address_text && (
            <div className="glass-panel px-4 py-4 flex items-start gap-3">
              <MapPin size={18} className="text-muted shrink-0 mt-0.5" />
              <div className="min-w-0">
                <span className="text-[10px] text-black/40 font-semibold uppercase tracking-wider block">{t('listing.location')}</span>
                <p className="text-xs text-black/70 font-medium mt-1 truncate">{listing.address_text}</p>
              </div>
            </div>
          )}
        </div>

        {/* Specialists Extended Specs */}
        {!isCarpooling && (
          <div className="glass-panel p-5 space-y-4">
            <h3 className="text-xs font-bold text-black/30 uppercase tracking-wider">Деталі спеціаліста</h3>

            {listing.languages && listing.languages.length > 0 && (
              <div className="flex items-start gap-3">
                <Languages size={16} className="text-muted shrink-0 mt-0.5" />
                <div>
                  <span className="text-[10px] text-black/40 uppercase tracking-wider font-semibold block">Мови спілкування</span>
                  <div className="flex gap-1.5 mt-1">
                    {listing.languages.map((lang) => (
                      <span key={lang} className="bg-black/5 border border-black/8 text-xs text-black/70 font-semibold px-2 py-0.5 rounded-md">
                        {lang}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {listing.districts && listing.districts.length > 0 && (
              <div className="flex items-start gap-3 pt-2 border-t border-black/7">
                <MapPin size={16} className="text-muted shrink-0 mt-0.5" />
                <div>
                  <span className="text-[10px] text-black/40 uppercase tracking-wider font-semibold block">Райони обслуговування</span>
                  <div className="flex flex-wrap gap-1.5 mt-1">
                    {listing.districts.map((d) => (
                      <span key={d} className="bg-black/5 border border-black/8 text-xs text-black/60 font-medium px-2.5 py-0.5 rounded-md">
                        {d === 'Out of Town / Delivery' ? 'Виїзд по місту' : d}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {listing.services && listing.services.length > 0 && (
              <div className="flex items-start gap-3 pt-2 border-t border-black/7">
                <HelpCircle size={16} className="text-muted shrink-0 mt-0.5" />
                <div>
                  <span className="text-[10px] text-black/40 uppercase tracking-wider font-semibold block">Послуги та спеціалізація</span>
                  <div className="flex flex-wrap gap-1 mt-1.5">
                    {listing.services.map((s, idx) => (
                      <span key={idx} className="bg-[#c9a84c]/10 border border-[#c9a84c]/25 text-[11px] text-[#c9a84c] font-semibold px-2.5 py-0.5 rounded-full">
                        #{s}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Carpooling details */}
        {isCarpooling && (
          <div className="glass-panel p-5 space-y-3">
            <div className="flex items-center gap-2 text-muted">
              <Clock size={16} />
              <span className="text-sm font-semibold">{t('carpooling.title')}</span>
            </div>
            <div className="grid grid-cols-2 gap-4 text-xs">
              <div>
                <span className="text-[10px] text-black/40 uppercase">{t('carpooling.date_label')}</span>
                <p className="text-foreground font-medium mt-1">{listing.departure_date}</p>
              </div>
              <div>
                <span className="text-[10px] text-black/40 uppercase">{t('carpooling.time_label')}</span>
                <p className="text-foreground font-medium mt-1">{listing.departure_time}</p>
              </div>
              <div>
                <span className="text-[10px] text-black/40 uppercase">{t('carpooling.origin_label')}</span>
                <p className="text-foreground font-medium mt-1">{listing.origin}</p>
              </div>
              <div>
                <span className="text-[10px] text-black/40 uppercase">{t('carpooling.destination_label')}</span>
                <p className="text-foreground font-medium mt-1">{listing.destination}</p>
              </div>
            </div>
            <div className="flex items-center justify-center gap-3 pt-4 text-xs text-black/60 bg-black/4 rounded-xl p-3 border border-black/7">
              <span className="font-semibold">{listing.origin}</span>
              <ArrowRight size={16} className="text-muted" />
              <span className="font-semibold">{listing.destination}</span>
            </div>
          </div>
        )}

        {/* Description */}
        <div className="glass-panel p-5 space-y-2">
          <h3 className="text-xs font-bold text-black/30 uppercase tracking-wider">Опис послуги</h3>
          <p className="text-sm text-black/75 leading-relaxed whitespace-pre-wrap font-medium">
            {listing.description}
          </p>
        </div>

        {/* Contact buttons */}
        <div className="space-y-2">
          <a
            href={`https://t.me/${listing.telegram_username}`}
            target="_blank"
            rel="noopener noreferrer"
            onClick={() => handleContactClick('telegram')}
            className="btn-primary w-full flex items-center justify-center gap-2 text-center py-3.5 font-bold"
          >
            <MessageCircle size={18} />
            <span>Написати в Telegram (@{listing.telegram_username})</span>
            <ExternalLink size={14} className="opacity-50" />
          </a>

          {listing.phone && (
            <a
              href={`tel:${listing.phone}`}
              onClick={() => handleContactClick('phone')}
              className="px-4 py-3.5 rounded-2xl bg-white/82 backdrop-blur-sm border border-black/10 hover:bg-white/95 text-foreground flex items-center justify-center gap-2 transition-all duration-200 font-bold"
            >
              <Phone size={18} className="text-muted" />
              <span>Зателефонувати: {listing.phone}</span>
            </a>
          )}
        </div>

        {/* Reviews section */}
        <div className="space-y-3 pt-2">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-display font-bold text-foreground">{t('listing.reviews')}</h3>
            <button
              onClick={() => {
                if (!profile) {
                  toast.error(t('chat.auth_required'));
                  return;
                }
                if (profile.status !== 'approved') {
                  toast.error('Залишати відгуки можуть лише верифіковані члени груп.');
                  return;
                }
                setShowReviewForm(!showReviewForm);
              }}
              className="text-xs text-black/50 font-semibold hover:text-black hover:underline"
            >
              {t('listing.leave_review')}
            </button>
          </div>

          {showReviewForm && (
            <div className="glass-panel p-4 space-y-3 animate-slide-up">
              <StarRating
                rating={reviewRating}
                size={24}
                showValue={false}
                interactive
                onChange={setReviewRating}
              />
              <textarea
                value={reviewComment}
                onChange={(e) => setReviewComment(e.target.value)}
                placeholder="Розкажіть про ваш досвід роботи з цим спеціалістом…"
                rows={3}
                className="input-glass text-sm resize-none"
              />
              <button
                type="button"
                onClick={() => {
                  if (!profile) {
                    toast.error(t('chat.auth_required'));
                    return;
                  }
                  if (profile.status !== 'approved') {
                    toast.error('Залишати відгуки можуть лише верифіковані учасники групи.');
                    return;
                  }
                  if (userReview) {
                    toast.error(t('listing.review_exists'));
                    return;
                  }
                  addReview({
                    id: `rev-${Date.now()}`,
                    listing_id: listing.id,
                    user_id: profile.id,
                    rating: reviewRating,
                    comment: reviewComment.trim() || null,
                    created_at: new Date().toISOString(),
                    profile,
                    status: 'pending',
                    owner_reply: null,
                  });
                  setReviewComment('');
                  setShowReviewForm(false);
                  toast.success('Відгук надіслано на модерацію!');
                }}
                className="btn-primary py-2 px-4 text-xs flex items-center gap-2 font-bold"
              >
                <Send size={14} />
                <span>Надіслати на модерацію</span>
              </button>
            </div>
          )}

          {visibleReviews.length > 0 ? (
            <div className="space-y-3">
              {visibleReviews.map((rev) => {
                const isMyReview = profile && rev.user_id === profile.id;
                return (
                  <div key={rev.id} className="glass-panel p-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <span className="text-xs font-bold text-black/80">
                          {rev.profile?.first_name ?? 'Клієнт'}
                        </span>
                        {rev.status === 'pending' && (
                          <span className="ml-2 inline-block text-[9px] font-bold text-[#c9a84c] bg-[#c9a84c]/10 border border-[#c9a84c]/20 rounded px-1.5 py-0.5">
                            На модерації
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-3">
                        <StarRating rating={rev.rating} size={12} />
                        {profile && !isMyReview && (
                          <button
                            type="button"
                            onClick={() => handleReportReview(rev.id)}
                            className="text-[10px] text-black/20 hover:text-red-500 flex items-center gap-0.5 border border-black/7 hover:border-red-200 rounded px-1.5 py-0.5"
                          >
                            <AlertTriangle size={10} />
                            Поскаржитися
                          </button>
                        )}
                      </div>
                    </div>
                    {rev.comment && (
                      <p className="text-xs text-black/60 leading-relaxed font-medium">{rev.comment}</p>
                    )}

                    {/* Owner reply */}
                    {rev.owner_reply ? (
                      <div className="ml-4 pl-3.5 border-l-2 border-black/15 space-y-1 py-0.5">
                        <div className="flex items-center gap-1.5">
                          <CornerDownRight size={12} className="text-muted" />
                          <span className="text-[10px] font-bold text-muted">
                            Відповідь спеціаліста
                          </span>
                        </div>
                        <p className="text-[11px] text-black/50 leading-relaxed font-medium italic">
                          {rev.owner_reply}
                        </p>
                      </div>
                    ) : (
                      isOwner && rev.status === 'approved' && (
                        <div className="pt-2 pl-4">
                          {activeReplyBox === rev.id ? (
                            <div className="space-y-2">
                              <textarea
                                value={replyTexts[rev.id] || ''}
                                onChange={(e) =>
                                  setReplyTexts((prev) => ({ ...prev, [rev.id]: e.target.value }))
                                }
                                placeholder="Напишіть публічну відповідь на відгук…"
                                rows={2}
                                className="input-glass text-xs resize-none"
                              />
                              <div className="flex gap-2">
                                <button
                                  type="button"
                                  onClick={() => handleSendReply(rev.id)}
                                  className="btn-primary py-1 px-3 text-[10px] font-bold"
                                >
                                  Відповісти
                                </button>
                                <button
                                  type="button"
                                  onClick={() => setActiveReplyBox(null)}
                                  className="px-3 py-1 bg-black/4 border border-black/8 hover:bg-black/7 text-[10px] font-bold text-muted rounded-xl transition-all"
                                >
                                  Скасувати
                                </button>
                              </div>
                            </div>
                          ) : (
                            <button
                              type="button"
                              onClick={() => setActiveReplyBox(rev.id)}
                              className="text-[10px] text-muted font-bold hover:text-black hover:underline flex items-center gap-1"
                            >
                              <CornerDownRight size={10} />
                              Відповісти на відгук
                            </button>
                          )}
                        </div>
                      )
                    )}
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="glass-panel">
              <EmptyState icon={MessageSquare} message={t('listing.no_reviews')} className="py-8" />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
