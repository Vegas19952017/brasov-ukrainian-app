// ============================================
// Core Type Definitions - Brasov Ukrainian TMA
// ============================================

export type ProfileStatus = 'pending' | 'approved' | 'rejected';
export type UserRole = 'user' | 'admin';

export interface Profile {
  id: string;
  telegram_id: number;
  username: string | null;
  first_name: string;
  role: UserRole;
  status: ProfileStatus;
  created_at: string;
}

export interface Category {
  id: string;
  slug: string;
  name_uk: string;
  name_ro: string;
  name_en: string;
  icon: string;
}

export interface Listing {
  id: string;
  user_id: string;
  category_id: string;
  title: string;
  description: string;
  price: number | null;
  currency: 'RON' | 'EUR' | 'UAH' | null;
  photos: string[];
  telegram_username: string;
  owner_telegram_id?: number;
  status: 'pending' | 'approved' | 'rejected';
  // NEW: reason shown to specialist when listing is rejected
  rejection_reason: string | null;
  rating_avg: number;
  latitude: number | null;
  longitude: number | null;
  address_text: string | null;
  departure_date: string | null;
  departure_time: string | null;
  origin: string | null;
  destination: string | null;
  is_featured: boolean;

  // MVP extensions
  languages: ('RU' | 'RO' | 'EN' | 'UA')[];
  districts: string[];
  services: string[];
  phone: string | null;
  is_verified: boolean;
  promotion_level: 'free' | 'basic' | 'premium';
  promotion_until: string | null;

  created_at: string;
  category?: Category;
  profile?: Profile;
  reviews_count?: number;
}

export interface BlacklistEntry {
  id: string;
  telegram_id: number;
  reason_uk: string;
  reason_ro: string;
  reason_en: string;
  proof_url: string | null;
  added_at: string;
}

export interface Review {
  id: string;
  listing_id: string;
  user_id: string;
  rating: number;
  comment: string | null;
  created_at: string;
  profile?: Profile;

  // Review MVP extensions
  status: 'pending' | 'approved' | 'rejected';
  owner_reply: string | null;
}

export interface ReviewComplaint {
  id: string;
  review_id: string;
  user_id: string;
  reason: string;
  created_at: string;
  review?: Review;
  profile?: Profile;
}

export interface AnalyticsEvent {
  id: string;
  listing_id: string;
  event_type: 'view' | 'click_contact';
  created_at: string;
}

export type ChatAttachmentType = 'image' | 'file';

export interface ChatMessage {
  id: string;
  room_id: string;
  user_id: string;
  body: string;
  attachment_url: string | null;
  attachment_type: ChatAttachmentType | null;
  attachment_name: string | null;
  created_at: string;
  profile?: Profile;
}

export type NotificationType =
  | 'profile_approved'
  | 'profile_rejected'
  | 'listing_approved'
  | 'listing_rejected'
  | 'chat_message'
  | 'review_received';

export interface AppNotification {
  id: string;
  user_id: string;
  type: NotificationType;
  title_uk: string;
  title_ro: string;
  title_en: string;
  body_uk: string;
  body_ro: string;
  body_en: string;
  link: string | null;
  read: boolean;
  created_at: string;
}

export type Language = 'uk' | 'ro' | 'en';
export type ViewMode = 'list' | 'map';

export interface TelegramUser {
  id: number;
  first_name: string;
  last_name?: string;
  username?: string;
  language_code?: string;
  is_premium?: boolean;
  photo_url?: string;
}

export interface SearchFilters {
  query: string;
  category_id: string | null;
  min_price: number | null;
  max_price: number | null;
  currency: string | null;
  sort_by: 'newest' | 'rating' | 'price_asc' | 'price_desc';
  departure_date: string | null;
  origin: string | null;
  destination: string | null;

  // Custom filters
  languages: string[];
  districts: string[];
  min_rating: number | null;
}

export const DEFAULT_FILTERS: SearchFilters = {
  query: '',
  category_id: null,
  min_price: null,
  max_price: null,
  currency: null,
  sort_by: 'newest',
  departure_date: null,
  origin: null,
  destination: null,
  languages: [],
  districts: [],
  min_rating: null,
};

export const COMMUNITY_CHAT_ROOM_ID = 'community';

export type PaymentProvider = 'stripe' | 'stars';
export type PaymentStatus = 'pending' | 'paid' | 'failed' | 'refunded';
export type PaymentPlan = 'basic' | 'premium' | 'boost';

export interface Payment {
  id: string;
  listing_id: string;
  user_id: string;
  provider: PaymentProvider;
  plan: PaymentPlan;
  currency: 'EUR' | 'RON' | 'XTR';
  amount: number;
  status: PaymentStatus;
  stripe_session_id: string | null;
  stripe_payment_intent: string | null;
  telegram_charge_id: string | null;
  created_at: string;
  paid_at: string | null;
}
