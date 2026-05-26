import type {
  Profile,
  Listing,
  BlacklistEntry,
  Review,
  ChatMessage,
  AppNotification,
  ReviewComplaint,
  AnalyticsEvent,
} from '../types';

const STORAGE_KEY = 'brasov-app-v2';

export interface PersistedState {
  profiles: Profile[];
  listings: Listing[];
  blacklist: BlacklistEntry[];
  reviews: Review[];
  chatMessages: ChatMessage[];
  notifications: AppNotification[];
  reviewComplaints: ReviewComplaint[];
  analyticsEvents: AnalyticsEvent[];
  initialized: boolean;
}

const EMPTY: PersistedState = {
  profiles: [],
  listings: [],
  blacklist: [],
  reviews: [],
  chatMessages: [],
  notifications: [],
  reviewComplaints: [],
  analyticsEvents: [],
  initialized: false,
};

export function loadPersistedState(): PersistedState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { ...EMPTY };
    const parsed = JSON.parse(raw) as PersistedState;
    return {
      profiles: parsed.profiles ?? [],
      listings: parsed.listings ?? [],
      blacklist: parsed.blacklist ?? [],
      reviews: parsed.reviews ?? [],
      chatMessages: parsed.chatMessages ?? [],
      notifications: parsed.notifications ?? [],
      reviewComplaints: parsed.reviewComplaints ?? [],
      analyticsEvents: parsed.analyticsEvents ?? [],
      initialized: parsed.initialized ?? false,
    };
  } catch {
    return { ...EMPTY };
  }
}

export function savePersistedState(state: PersistedState): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

export function getPersistedSnapshot(getState: () => {
  profiles: Profile[];
  listings: Listing[];
  blacklist: BlacklistEntry[];
  reviews: Review[];
  chatMessages: ChatMessage[];
  notifications: AppNotification[];
  reviewComplaints: ReviewComplaint[];
  analyticsEvents: AnalyticsEvent[];
  dataInitialized: boolean;
}): PersistedState {
  const s = getState();
  return {
    profiles: s.profiles,
    listings: s.listings,
    blacklist: s.blacklist,
    reviews: s.reviews,
    chatMessages: s.chatMessages,
    notifications: s.notifications,
    reviewComplaints: s.reviewComplaints,
    analyticsEvents: s.analyticsEvents,
    initialized: s.dataInitialized,
  };
}
