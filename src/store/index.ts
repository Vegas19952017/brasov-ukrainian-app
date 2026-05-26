import { create } from 'zustand';
import type {
  Profile,
  Listing,
  Category,
  BlacklistEntry,
  Review,
  ReviewComplaint,
  AnalyticsEvent,
  ChatMessage,
  AppNotification,
  SearchFilters,
  Language,
  ViewMode,
  ChatAttachmentType,
} from '../types';
import { DEFAULT_FILTERS, COMMUNITY_CHAT_ROOM_ID } from '../types';
import { DEMO_CATEGORIES, DEMO_LISTINGS, DEMO_BLACKLIST } from './demo-data';
import { loadPersistedState, savePersistedState } from '../lib/persistence';
import {
  notifyChatMessage,
  notifyListingApproved,
  notifyListingRejected,
  notifyProfileApproved,
  notifyProfileRejected,
  notifyReviewReceived,
} from '../lib/notifications';
import { isSupabaseConfigured, supabase } from '../lib/supabase';

interface AppState {
  profile: Profile | null;
  isAuthenticated: boolean;
  profiles: Profile[];
  categories: Category[];
  listings: Listing[];
  blacklist: BlacklistEntry[];
  reviews: Review[];
  chatMessages: ChatMessage[];
  notifications: AppNotification[];
  reviewComplaints: ReviewComplaint[];
  analyticsEvents: AnalyticsEvent[];
  dataInitialized: boolean;
  dataLoading: boolean;

  setProfile: (profile: Profile | null) => void;
  upsertProfile: (profile: Profile) => void;
  setCategories: (cats: Category[]) => void;
  setListings: (listings: Listing[]) => void;
  addListing: (listing: Listing) => void;
  updateListing: (id: string, updates: Partial<Listing>) => void;
  // NEW: reject listing with optional reason, fires rejection notification
  rejectListing: (id: string, reason?: string) => void;
  removeListing: (id: string) => void;
  setBlacklist: (bl: BlacklistEntry[]) => void;
  addReview: (review: Review) => void;
  getReviewsForListing: (listingId: string) => Review[];
  approveReview: (id: string) => void;
  rejectReview: (id: string) => void;
  submitReviewComplaint: (reviewId: string, userId: string, reason: string) => void;
  addReviewReply: (reviewId: string, replyText: string) => void;
  logAnalyticsEvent: (listingId: string, eventType: 'view' | 'click_contact') => void;
  setPromotionLevel: (listingId: string, level: 'free' | 'basic' | 'premium', durationDays?: number) => void;
  setVerificationStatus: (listingId: string, isVerified: boolean) => void;
  sendChatMessage: (body: string, attachment?: {
    url: string;
    type: ChatAttachmentType;
    name: string;
  }) => boolean;
  addNotification: (n: AppNotification) => void;
  markNotificationRead: (id: string) => void;
  markAllNotificationsRead: () => void;
  approveProfile: (id: string) => void;
  rejectProfile: (id: string) => void;

  language: Language;
  setLanguage: (lang: Language) => void;
  viewMode: ViewMode;
  setViewMode: (mode: ViewMode) => void;
  filters: SearchFilters;
  setFilters: (filters: Partial<SearchFilters>) => void;
  resetFilters: () => void;
  selectedCategorySlug: string | null;
  setSelectedCategorySlug: (slug: string | null) => void;
  heroExpanded: boolean;
  setHeroExpanded: (expanded: boolean) => void;

  isBlacklisted: (telegramId: number) => boolean;
  isListingBlacklisted: (listing: Listing) => boolean;
  isProfileApproved: (profile?: Profile | null) => boolean;
  canAccessChat: () => boolean;
  unreadNotificationCount: () => number;
  getFilteredListings: () => Listing[];
  persist: () => void;
  loadAppData: () => Promise<void>;
  initDemoData: () => void;
}

function withOwnerTelegramId(listings: Listing[]): Listing[] {
  return listings.map((l) => ({
    ...l,
    owner_telegram_id: l.owner_telegram_id ?? 0,
    languages: l.languages ?? ['RU'],
    districts: l.districts ?? [],
    services: l.services ?? [],
    phone: l.phone ?? null,
    is_verified: l.is_verified ?? false,
    promotion_level: l.promotion_level ?? 'free',
    promotion_until: l.promotion_until ?? null,
    rejection_reason: l.rejection_reason ?? null,
  }));
}

export const useStore = create<AppState>((set, get) => ({
  profile: null,
  isAuthenticated: false,
  profiles: [],
  categories: [],
  listings: [],
  blacklist: [],
  reviews: [],
  chatMessages: [],
  notifications: [],
  reviewComplaints: [],
  analyticsEvents: [],
  dataInitialized: false,
  dataLoading: false,

  setProfile: (profile) => set({ profile, isAuthenticated: !!profile }),

  upsertProfile: (profile) => {
    set((s) => {
      const exists = s.profiles.find((p) => p.id === profile.id);
      const profiles = exists
        ? s.profiles.map((p) => (p.id === profile.id ? profile : p))
        : [...s.profiles, profile];
      return { profiles, profile };
    });
    get().persist();
  },

  setCategories: (categories) => set({ categories }),
  setListings: (listings) => set({ listings }),

  addListing: (listing) => {
    set((s) => ({ listings: [listing, ...s.listings] }));
    get().persist();
  },

  updateListing: (id, updates) => {
    const prev = get().listings.find((l) => l.id === id);
    set((s) => ({
      listings: s.listings.map((l) => (l.id === id ? { ...l, ...updates } : l)),
    }));
    const updated = get().listings.find((l) => l.id === id);
    // Fire approval notification
    if (prev?.status === 'pending' && updated?.status === 'approved' && updated.user_id) {
      get().addNotification(notifyListingApproved(updated.user_id, updated.title));
    }
    get().persist();
  },

  // NEW: reject listing with reason, fires rejection notification to owner
  rejectListing: (id, reason) => {
    const listing = get().listings.find((l) => l.id === id);
    if (!listing) return;
    set((s) => ({
      listings: s.listings.map((l) =>
        l.id === id
          ? { ...l, status: 'rejected' as const, rejection_reason: reason ?? null }
          : l
      ),
    }));
    // Send rejection notification with reason to the listing owner
    get().addNotification(
      notifyListingRejected(listing.user_id, listing.title, reason)
    );
    get().persist();
  },

  removeListing: (id) => {
    set((s) => ({ listings: s.listings.filter((l) => l.id !== id) }));
    get().persist();
  },

  setBlacklist: (blacklist) => set({ blacklist }),

  addReview: (review) => {
    set((s) => {
      const filtered = s.reviews.filter(
        (r) => !(r.listing_id === review.listing_id && r.user_id === review.user_id)
      );
      return { reviews: [...filtered, { ...review, status: 'pending' }] };
    });
    // Notify listing owner about the new (pending) review
    const listing = get().listings.find((l) => l.id === review.listing_id);
    if (listing && listing.user_id !== review.user_id) {
      get().addNotification(
        notifyReviewReceived(listing.user_id, listing.title, listing.id)
      );
    }
    get().persist();
  },

  getReviewsForListing: (listingId) =>
    get()
      .reviews.filter((r) => r.listing_id === listingId)
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()),

  approveReview: (id) => {
    set((s) => {
      const reviews = s.reviews.map((r) =>
        r.id === id ? { ...r, status: 'approved' as const } : r
      );
      const review = reviews.find((r) => r.id === id);
      const listings = s.listings.map((l) => {
        if (!review || l.id !== review.listing_id) return l;
        const listingReviews = reviews.filter((r) => r.listing_id === l.id && r.status === 'approved');
        const avg =
          listingReviews.length > 0
            ? listingReviews.reduce((sum, r) => sum + r.rating, 0) / listingReviews.length
            : 0;
        return { ...l, rating_avg: Math.round(avg * 10) / 10 };
      });
      return { reviews, listings };
    });
    get().persist();
  },

  rejectReview: (id) => {
    set((s) => {
      const reviews = s.reviews.map((r) =>
        r.id === id ? { ...r, status: 'rejected' as const } : r
      );
      const review = reviews.find((r) => r.id === id);
      const listings = s.listings.map((l) => {
        if (!review || l.id !== review.listing_id) return l;
        const listingReviews = reviews.filter((r) => r.listing_id === l.id && r.status === 'approved');
        const avg =
          listingReviews.length > 0
            ? listingReviews.reduce((sum, r) => sum + r.rating, 0) / listingReviews.length
            : 0;
        return { ...l, rating_avg: Math.round(avg * 10) / 10 };
      });
      return { reviews, listings };
    });
    get().persist();
  },

  submitReviewComplaint: (reviewId, userId, reason) => {
    const complaint: ReviewComplaint = {
      id: `rc-${Date.now()}`,
      review_id: reviewId,
      user_id: userId,
      reason,
      created_at: new Date().toISOString(),
    };
    set((s) => {
      const exists = s.reviewComplaints.some(
        (c) => c.review_id === reviewId && c.user_id === userId
      );
      if (exists) return {};
      return { reviewComplaints: [...s.reviewComplaints, complaint] };
    });
    get().persist();
  },

  addReviewReply: (reviewId, replyText) => {
    set((s) => ({
      reviews: s.reviews.map((r) =>
        r.id === reviewId ? { ...r, owner_reply: replyText.trim() || null } : r
      ),
    }));
    get().persist();
  },

  logAnalyticsEvent: (listingId, eventType) => {
    const event: AnalyticsEvent = {
      id: `ae-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      listing_id: listingId,
      event_type: eventType,
      created_at: new Date().toISOString(),
    };
    set((s) => ({ analyticsEvents: [...s.analyticsEvents, event] }));
    get().persist();
  },

  setPromotionLevel: (listingId, level, durationDays) => {
    const until = durationDays
      ? new Date(Date.now() + durationDays * 24 * 60 * 60 * 1000).toISOString()
      : null;
    set((s) => ({
      listings: s.listings.map((l) =>
        l.id === listingId
          ? {
              ...l,
              promotion_level: level,
              promotion_until: until,
              is_featured: level === 'premium',
            }
          : l
      ),
    }));
    get().persist();
  },

  setVerificationStatus: (listingId, isVerified) => {
    set((s) => ({
      listings: s.listings.map((l) =>
        l.id === listingId ? { ...l, is_verified: isVerified } : l
      ),
    }));
    get().persist();
  },

  sendChatMessage: (body, attachment) => {
    const { profile, canAccessChat, profiles, chatMessages } = get();
    if (!profile || !canAccessChat()) return false;
    const trimmed = body.trim();
    if (!trimmed && !attachment) return false;

    const msg: ChatMessage = {
      id: `msg-${Date.now()}`,
      room_id: COMMUNITY_CHAT_ROOM_ID,
      user_id: profile.id,
      body: trimmed,
      attachment_url: attachment?.url ?? null,
      attachment_type: attachment?.type ?? null,
      attachment_name: attachment?.name ?? null,
      created_at: new Date().toISOString(),
      profile,
    };

    set({ chatMessages: [...chatMessages, msg] });

    const approvedIds = profiles.filter((p) => p.status === 'approved').map((p) => p.id);
    const newNotifs = notifyChatMessage(approvedIds, profile.first_name, profile.id);
    set((s) => ({ notifications: [...newNotifs, ...s.notifications] }));
    get().persist();
    return true;
  },

  addNotification: (n) => {
    set((s) => ({ notifications: [n, ...s.notifications] }));
    get().persist();
  },

  markNotificationRead: (id) => {
    set((s) => ({
      notifications: s.notifications.map((n) =>
        n.id === id ? { ...n, read: true } : n
      ),
    }));
    get().persist();
  },

  markAllNotificationsRead: () => {
    const { profile, notifications } = get();
    if (!profile) return;
    set({
      notifications: notifications.map((n) =>
        n.user_id === profile.id ? { ...n, read: true } : n
      ),
    });
    get().persist();
  },

  approveProfile: (id) => {
    const p = get().profiles.find((x) => x.id === id);
    if (!p) return;
    const updated = { ...p, status: 'approved' as const };
    set((s) => ({
      profiles: s.profiles.map((x) => (x.id === id ? updated : x)),
    }));
    get().addNotification(notifyProfileApproved(updated));
    get().persist();
  },

  rejectProfile: (id) => {
    const p = get().profiles.find((x) => x.id === id);
    set((s) => ({
      profiles: s.profiles.map((x) =>
        x.id === id ? { ...x, status: 'rejected' as const } : x
      ),
    }));
    // NEW: send rejection notification to profile owner
    if (p) {
      get().addNotification(notifyProfileRejected({ ...p, status: 'rejected' }));
    }
    get().persist();
  },

  language: (localStorage.getItem('brasov-lang') as Language) || 'uk',
  setLanguage: (language) => {
    localStorage.setItem('brasov-lang', language);
    set({ language });
  },
  viewMode: 'list',
  setViewMode: (viewMode) => set({ viewMode }),
  filters: { ...DEFAULT_FILTERS },
  setFilters: (updates) => set((s) => ({ filters: { ...s.filters, ...updates } })),
  resetFilters: () =>
    set({ filters: { ...DEFAULT_FILTERS }, selectedCategorySlug: null }),
  selectedCategorySlug: null,
  setSelectedCategorySlug: (slug) => set({ selectedCategorySlug: slug }),
  heroExpanded: false,
  setHeroExpanded: (heroExpanded) => set({ heroExpanded }),

  isBlacklisted: (telegramId) =>
    get().blacklist.some((b) => b.telegram_id === telegramId),

  isListingBlacklisted: (listing) => {
    const tid = listing.owner_telegram_id ?? 0;
    return tid > 0 && get().blacklist.some((b) => b.telegram_id === tid);
  },

  isProfileApproved: (profile) => (profile ?? get().profile)?.status === 'approved',

  canAccessChat: () => {
    const p = get().profile;
    return !!p && p.status === 'approved' && !get().isBlacklisted(p.telegram_id);
  },

  unreadNotificationCount: () => {
    const { profile, notifications } = get();
    if (!profile) return 0;
    return notifications.filter((n) => n.user_id === profile.id && !n.read).length;
  },

  getFilteredListings: () => {
    const { listings, filters, selectedCategorySlug, categories } = get();
    let result = listings.filter((l) => l.status === 'approved');

    if (selectedCategorySlug) {
      const cat = categories.find((c) => c.slug === selectedCategorySlug);
      if (cat) result = result.filter((l) => l.category_id === cat.id);
    }

    if (filters.query) {
      const q = filters.query.toLowerCase();
      result = result.filter(
        (l) =>
          l.title.toLowerCase().includes(q) ||
          l.description.toLowerCase().includes(q) ||
          l.telegram_username.toLowerCase().includes(q) ||
          l.services?.some((s) => s.toLowerCase().includes(q))
      );
    }

    if (filters.min_price !== null) {
      result = result.filter((l) => l.price !== null && l.price >= filters.min_price!);
    }
    if (filters.max_price !== null) {
      result = result.filter((l) => l.price !== null && l.price <= filters.max_price!);
    }
    if (filters.currency) {
      result = result.filter((l) => l.currency === filters.currency);
    }
    if (filters.departure_date) {
      result = result.filter((l) => l.departure_date === filters.departure_date);
    }
    if (filters.origin) {
      const o = filters.origin.toLowerCase();
      result = result.filter((l) => l.origin?.toLowerCase().includes(o));
    }
    if (filters.destination) {
      const d = filters.destination.toLowerCase();
      result = result.filter((l) => l.destination?.toLowerCase().includes(d));
    }

    if (filters.languages && filters.languages.length > 0) {
      result = result.filter((l) =>
        l.languages?.some((lang) => filters.languages.includes(lang))
      );
    }

    if (filters.districts && filters.districts.length > 0) {
      result = result.filter((l) =>
        l.districts?.some((d) => filters.districts.includes(d))
      );
    }

    if (filters.min_rating !== null) {
      result = result.filter((l) => l.rating_avg >= filters.min_rating!);
    }

    result.sort((a, b) => {
      // 1. Sort by promotion level (Premium -> Basic -> Free)
      const promoOrder = { premium: 2, basic: 1, free: 0 };
      const promoA = promoOrder[a.promotion_level || 'free'] ?? 0;
      const promoB = promoOrder[b.promotion_level || 'free'] ?? 0;
      if (promoA !== promoB) return promoB - promoA;

      // 2. Sort within promotion tier
      switch (filters.sort_by) {
        case 'rating':
          return b.rating_avg - a.rating_avg;
        case 'price_asc':
          return (a.price ?? 9999999) - (b.price ?? 9999999);
        case 'price_desc':
          return (b.price ?? 0) - (a.price ?? 0);
        default: // newest
          return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      }
    });

    return result;
  },

  persist: () => {
    const s = get();
    savePersistedState({
      profiles: s.profiles,
      listings: s.listings,
      blacklist: s.blacklist,
      reviews: s.reviews,
      chatMessages: s.chatMessages,
      notifications: s.notifications,
      reviewComplaints: s.reviewComplaints,
      analyticsEvents: s.analyticsEvents,
      initialized: true,
    });
  },

  loadAppData: async () => {
    set({ dataLoading: true });
    const persisted = loadPersistedState();

    if (persisted.initialized) {
      set({
        profiles: persisted.profiles,
        listings: withOwnerTelegramId(persisted.listings),
        blacklist: persisted.blacklist,
        reviews: persisted.reviews,
        chatMessages: persisted.chatMessages,
        notifications: persisted.notifications,
        reviewComplaints: persisted.reviewComplaints ?? [],
        analyticsEvents: persisted.analyticsEvents ?? [],
        categories: DEMO_CATEGORIES,
        dataInitialized: true,
        dataLoading: false,
      });
      return;
    }

    if (isSupabaseConfigured()) {
      try {
        const [{ data: cats }, { data: lst }, { data: bl }, { data: rev }, { data: msgs }] =
          await Promise.all([
            supabase.from('categories').select('*'),
            supabase.from('listings').select('*'),
            supabase.from('blacklist').select('*'),
            supabase.from('reviews').select('*'),
            supabase
              .from('chat_messages')
              .select('*')
              .eq('room_id', COMMUNITY_CHAT_ROOM_ID)
              .order('created_at', { ascending: true }),
          ]);

        set({
          categories: cats?.length ? cats : DEMO_CATEGORIES,
          listings: withOwnerTelegramId(lst?.length ? lst : DEMO_LISTINGS),
          blacklist: bl?.length ? bl : DEMO_BLACKLIST,
          reviews: rev ?? [],
          chatMessages: msgs ?? [],
          reviewComplaints: [],
          analyticsEvents: [],
          dataInitialized: true,
          dataLoading: false,
        });
        get().persist();
        return;
      } catch {
        /* fallback demo */
      }
    }

    get().initDemoData();
    set({ dataLoading: false });
  },

  initDemoData: () => {
    const listings = withOwnerTelegramId(
      DEMO_LISTINGS.map((l) => ({
        ...l,
        owner_telegram_id:
          l.owner_telegram_id ||
          (l.telegram_username === 'scam_rental' ? 999888777 : 0),
      }))
    );
    set({
      categories: DEMO_CATEGORIES,
      listings,
      blacklist: DEMO_BLACKLIST,
      reviews: [],
      chatMessages: [],
      notifications: [],
      reviewComplaints: [],
      analyticsEvents: [],
      dataInitialized: true,
    });
    get().persist();
  },
}));
