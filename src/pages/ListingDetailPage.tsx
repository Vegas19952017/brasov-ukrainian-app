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

  // Log view event on mount
  useEffect(() => {
    if (listing) {
      logAnalyticsEvent(listing.id, 'view');
    }
  }, [id, listing, logAnalyticsEvent]);

  if (!listing) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <p className="text-white/40">{t('common.error')}</p>
      </div>
    );
  }

  const category = categories.find((c) => c.id === listing.category_id);
  const isBlacklisted = isListingBlacklisted(listing);
  const reviews = getReviewsForListing(listing.id);

  // Users see approved reviews, plus their own pending reviews
  const visibleReviews = reviews.filter(
    (r) => r.status === 'approved' || (profile && r.user_id === profile.id)
  );

  // Check if current user has already submitted a review
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
    const reason = window.prompt('Укажите причину жалобы на отзыв (спам, оскорбление, накрутка и т.д.):');
    if (reason && reason.trim()) {
      submitReviewComplaint(reviewId, profile.id, reason.trim());
      toast.success('Жалоба отправлена модератору!');
    }
  };

  const handleSendReply = (reviewId: string) => {
    const text = replyTexts[reviewId];
    if (!text || !text.trim()) return;
    addReviewReply(reviewId, text);
    setReplyTexts((prev) => ({ ...prev, [reviewId]: '' }));
    setActiveReplyBox(null);
    toast.success('Ответ опубликован!');
  };

  const promoLevel = listing.promotion_level || 'free';
  const isPremium = promoLevel === 'premium';
  const isBasic = promoLevel === 'basic';

  return (
    <div className="animate-fade-in pb-12">
      {/* Photo carousel */}
      {listing.photos.length > 0 ? (
        <div className="relative w-full aspect-[4/3] bg-obsidian-800 border-b border-glass-border">
          <img
            src={listing.photos[currentPhoto]}
            alt={listing.title}
            className="w-full h-full object-cover"
          />

          {/* Gradient overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-obsidian via-transparent to-obsidian/30" />

          {/* Navigation arrows */}
          {listing.photos.length > 1 && (
            <>
              <button
                onClick={prevPhoto}
                className="absolute left-3 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-black/50 backdrop-blur-sm flex items-center justify-center text-white/70 hover:text-white transition-colors"
              >
                <ChevronLeft size={18} />
              </button>
              <button
                onClick={nextPhoto}
                className="absolute right-3 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-black/50 backdrop-blur-sm flex items-center justify-center text-white/70 hover:text-white transition-colors"
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
                        ? 'bg-amber w-5'
                        : 'bg-white/30 hover:bg-white/50'
                    )}
                  />
                ))}
              </div>
            </>
          )}

          {/* Back button */}
          <button
            onClick={() => navigate(-1)}
            className="absolute top-4 left-4 w-9 h-9 rounded-xl bg-black/50 backdrop-blur-sm flex items-center justify-center text-white/70 hover:text-white transition-colors border border-white/10"
          >
            <ArrowLeft size={18} />
          </button>

          {/* Featured/Basic badge */}
          {isPremium && (
            <div className="absolute top-4 right-4 flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber/20 backdrop-blur-sm border border-amber/40 shadow-blue-glow">
              <Gem size={12} className="text-amber animate-pulse" />
              <span className="text-[10px] font-bold text-amber tracking-wider uppercase">{t('listing.featured')}</span>
            </div>
          )}
          {isBasic && (
            <div className="absolute top-4 right-4 flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-royal/20 backdrop-blur-sm border border-royal/40">
              <Award size={12} className="text-royal-light" />
              <span className="text-[10px] font-bold text-royal-light tracking-wider uppercase">Standard</span>
            </div>
          )}
        </div>
      ) : (
        <div className="px-4 pt-4">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center gap-2 text-white/50 hover:text-white transition-colors mb-4"
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
          <div className="flex items-start gap-3 bg-crimson/10 border border-crimson/30 rounded-xl p-4 animate-slide-up">
            <ShieldAlert size={20} className="text-crimson-light shrink-0 mt-0.5" />
            <p className="text-sm font-semibold text-crimson-light">
              {t('listing.blacklist_warning')}
            </p>
          </div>
        )}

        {/* Title & Category & Verification */}
        <div className="glass-panel p-5 relative overflow-hidden">
          {isPremium && <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-amber via-yellow-400 to-amber" />}
          <div className="flex items-center justify-between">
            {category && (
              <span className="text-[10px] text-royal-light font-bold uppercase tracking-wider bg-royal/10 px-2 py-0.5 rounded-md border border-royal/20">
                {getLocalizedName(category, i18n.language)}
              </span>
            )}
            {listing.is_verified && (
              <div className="flex items-center gap-1 text-[10px] text-emerald-400 font-bold bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-0.5 rounded-md">
                <CheckCircle size={12} />
                <span>Проверен</span>
              </div>
            )}
          </div>
          <h1 className="text-xl font-display font-bold text-white mt-3 leading-snug">
            {listing.title}
          </h1>
          <div className="flex items-center gap-3 mt-3">
            <StarRating rating={listing.rating_avg} size={16} />
            <span className="text-xs text-white/30">•</span>
            <span className="text-xs text-white/30 font-medium">
              {timeAgo(listing.created_at, i18n.language)}
            </span>
          </div>
        </div>

        {/* Price & Location */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {listing.price !== null && (
            <div className="glass-panel px-4 py-4.5 flex items-center justify-between">
              <span className="text-xs text-white/40 font-semibold uppercase tracking-wider">{t('listing.price')}</span>
              <span className="text-lg font-extrabold text-amber">
                {formatPrice(listing.price, listing.currency)}
              </span>
            </div>
          )}
          {listing.address_text && (
            <div className="glass-panel px-4 py-4 flex items-start gap-3">
              <MapPin size={18} className="text-royal-light shrink-0 mt-0.5" />
              <div className="min-w-0">
                <span className="text-[10px] text-white/40 font-semibold uppercase tracking-wider block">{t('listing.location')}</span>
                <p className="text-xs text-white/80 font-medium mt-1 truncate">{listing.address_text}</p>
              </div>
            </div>
          )}
        </div>

        {/* Specialists Extended Specs (Languages, Districts, Tags, Phone) */}
        {!isCarpooling && (
          <div className="glass-panel p-5 space-y-4">
            <h3 className="text-xs font-bold text-white/30 uppercase tracking-wider">Детали специалиста</h3>

            {/* Languages */}
            {listing.languages && listing.languages.length > 0 && (
              <div className="flex items-start gap-3">
                <Languages size={16} className="text-white/40 shrink-0 mt-0.5" />
                <div>
                  <span className="text-[10px] text-white/40 uppercase tracking-wider font-semibold block">Разговорные языки</span>
                  <div className="flex gap-1.5 mt-1">
                    {listing.languages.map((lang) => (
                      <span key={lang} className="bg-white/5 border border-white/5 text-xs text-white/70 font-semibold px-2 py-0.5 rounded-md">
                        {lang}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Districts */}
            {listing.districts && listing.districts.length > 0 && (
              <div className="flex items-start gap-3 pt-2 border-t border-glass-border">
                <MapPin size={16} className="text-white/40 shrink-0 mt-0.5" />
                <div>
                  <span className="text-[10px] text-white/40 uppercase tracking-wider font-semibold block">Районы обслуживания</span>
                  <div className="flex flex-wrap gap-1.5 mt-1">
                    {listing.districts.map((d) => (
                      <span key={d} className="bg-royal/10 border border-royal/20 text-xs text-royal-light font-medium px-2.5 py-0.5 rounded-md">
                        {d === 'Out of Town / Delivery' ? 'Выезд по городу' : d}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Services/Tags */}
            {listing.services && listing.services.length > 0 && (
              <div className="flex items-start gap-3 pt-2 border-t border-glass-border">
                <HelpCircle size={16} className="text-white/40 shrink-0 mt-0.5" />
                <div>
                  <span className="text-[10px] text-white/40 uppercase tracking-wider font-semibold block">Услуги и специализация</span>
                  <div className="flex flex-wrap gap-1 mt-1.5">
                    {listing.services.map((s, idx) => (
                      <span key={idx} className="bg-amber/10 border border-amber/20 text-[11px] text-amber font-semibold px-2.5 py-0.5 rounded-full">
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
            <div className="flex items-center gap-2 text-violet-400">
              <Clock size={16} />
              <span className="text-sm font-semibold">{t('carpooling.title')}</span>
            </div>
            <div className="grid grid-cols-2 gap-4 text-xs">
              <div>
                <span className="text-[10px] text-white/40 uppercase">{t('carpooling.date_label')}</span>
                <p className="text-white font-medium mt-1">{listing.departure_date}</p>
              </div>
              <div>
                <span className="text-[10px] text-white/40 uppercase">{t('carpooling.time_label')}</span>
                <p className="text-white font-medium mt-1">{listing.departure_time}</p>
              </div>
              <div>
                <span className="text-[10px] text-white/40 uppercase">{t('carpooling.origin_label')}</span>
                <p className="text-white font-medium mt-1">{listing.origin}</p>
              </div>
              <div>
                <span className="text-[10px] text-white/40 uppercase">{t('carpooling.destination_label')}</span>
                <p className="text-white font-medium mt-1">{listing.destination}</p>
              </div>
            </div>
            <div className="flex items-center justify-center gap-3 pt-4 text-xs text-white/60 bg-obsidian-900/50 rounded-xl p-3 border border-glass-border">
              <span className="font-semibold">{listing.origin}</span>
              <ArrowRight size={16} className="text-violet-400" />
              <span className="font-semibold">{listing.destination}</span>
            </div>
          </div>
        )}

        {/* Description */}
        <div className="glass-panel p-5 space-y-2">
          <h3 className="text-xs font-bold text-white/30 uppercase tracking-wider">Описание услуги</h3>
          <p className="text-sm text-white/80 leading-relaxed whitespace-pre-wrap font-medium">
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
            className="btn-primary w-full flex items-center justify-center gap-2 text-center py-3.5 shadow-blue-glow font-bold"
          >
            <MessageCircle size={18} />
            <span>Написать в Telegram (@{listing.telegram_username})</span>
            <ExternalLink size={14} className="opacity-50" />
          </a>

          {listing.phone && (
            <a
              href={`tel:${listing.phone}`}
              onClick={() => handleContactClick('phone')}
              className="px-4 py-3.5 rounded-2xl bg-glass border border-glass-border hover:bg-glass-hover text-white flex items-center justify-center gap-2 transition-all duration-200 font-bold"
            >
              <Phone size={18} className="text-royal-light" />
              <span>Позвонить: {listing.phone}</span>
            </a>
          )}
        </div>

        {/* Reviews section */}
        <div className="space-y-3 pt-2">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-display font-bold text-white">{t('listing.reviews')}</h3>
            <button
              onClick={() => {
                if (!profile) {
                  toast.error(t('chat.auth_required'));
                  return;
                }
                if (profile.status !== 'approved') {
                  toast.error('Оставлять отзывы могут только верифицированные члены групп.');
                  return;
                }
                setShowReviewForm(!showReviewForm);
              }}
              className="text-xs text-royal-light font-semibold hover:underline"
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
                placeholder="Расскажите о вашем опыте работы с этим специалистом…"
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
                    toast.error('Оставлять отзывы могут только верифицированные участники группы.');
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
                  toast.success('Отзыв отправлен на премодерацию админу!');
                }}
                className="btn-primary py-2 px-4 text-xs flex items-center gap-2 font-bold"
              >
                <Send size={14} />
                <span>Отправить на модерацию</span>
              </button>
            </div>
          )}

          {visibleReviews.length > 0 ? (
            <div className="space-y-3">
              {visibleReviews.map((rev) => {
                const isMyReview = profile && rev.user_id === profile.id;
                return (
                  <div key={rev.id} className="glass-panel p-4 space-y-3 border border-glass-border">
                    <div className="flex items-center justify-between">
                      <div>
                        <span className="text-xs font-bold text-white/80">
                          {rev.profile?.first_name ?? 'Клиент'}
                        </span>
                        {rev.status === 'pending' && (
                          <span className="ml-2 inline-block text-[9px] font-bold text-amber bg-amber/10 border border-amber/20 rounded px-1.5 py-0.2">
                            На модерации
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-3">
                        <StarRating rating={rev.rating} size={12} />
                        {profile && !isMyReview && (
                          <button
                            type="button"
                            onClick={() => handleReportReview(rev.id)}
                            className="text-[10px] text-white/20 hover:text-crimson-light flex items-center gap-0.5 border border-white/5 hover:border-crimson/20 rounded px-1.5 py-0.5"
                          >
                            <AlertTriangle size={10} />
                            Пожаловаться
                          </button>
                        )}
                      </div>
                    </div>
                    {rev.comment && (
                      <p className="text-xs text-white/60 leading-relaxed font-medium">{rev.comment}</p>
                    )}

                    {/* Owner reply */}
                    {rev.owner_reply ? (
                      <div className="ml-4 pl-3.5 border-l-2 border-royal/40 space-y-1 py-0.5">
                        <div className="flex items-center gap-1.5">
                          <CornerDownRight size={12} className="text-royal-light" />
                          <span className="text-[10px] font-bold text-royal-light">
                            Ответ специалиста
                          </span>
                        </div>
                        <p className="text-[11px] text-white/50 leading-relaxed font-medium italic">
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
                                placeholder="Напишите публичный ответ на отзыв…"
                                rows={2}
                                className="input-glass text-xs resize-none"
                              />
                              <div className="flex gap-2">
                                <button
                                  type="button"
                                  onClick={() => handleSendReply(rev.id)}
                                  className="btn-primary py-1 px-3 text-[10px] font-bold"
                                >
                                  Ответить
                                </button>
                                <button
                                  type="button"
                                  onClick={() => setActiveReplyBox(null)}
                                  className="px-3 py-1 bg-white/5 border border-glass-border hover:bg-glass-hover text-[10px] font-bold text-white/60 rounded-xl transition-all"
                                >
                                  Отмена
                                </button>
                              </div>
                            </div>
                          ) : (
                            <button
                              type="button"
                              onClick={() => setActiveReplyBox(rev.id)}
                              className="text-[10px] text-royal-light font-bold hover:underline flex items-center gap-1"
                            >
                              <CornerDownRight size={10} />
                              Ответить на отзыв
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
