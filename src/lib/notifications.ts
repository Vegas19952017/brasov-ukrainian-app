import type { AppNotification, NotificationType, Profile } from '../types';

let idCounter = 0;

function nid(): string {
  return `ntf-${Date.now()}-${++idCounter}`;
}

export function createNotification(
  userId: string,
  type: NotificationType,
  payload: {
    title_uk: string;
    title_ro: string;
    title_en: string;
    body_uk: string;
    body_ro: string;
    body_en: string;
    link?: string | null;
  }
): AppNotification {
  return {
    id: nid(),
    user_id: userId,
    type,
    title_uk: payload.title_uk,
    title_ro: payload.title_ro,
    title_en: payload.title_en,
    body_uk: payload.body_uk,
    body_ro: payload.body_ro,
    body_en: payload.body_en,
    link: payload.link ?? null,
    read: false,
    created_at: new Date().toISOString(),
  };
}

export function notifyProfileApproved(profile: Profile): AppNotification {
  return createNotification(profile.id, 'profile_approved', {
    title_uk: 'Профіль схвалено',
    title_ro: 'Profil aprobat',
    title_en: 'Profile approved',
    body_uk: 'Тепер ви можете писати в загальному чаті спільноти.',
    body_ro: 'Acum puteți scrie în chatul comunității.',
    body_en: 'You can now post in the community chat.',
    link: '/chat',
  });
}

// NEW: notification when profile is rejected
export function notifyProfileRejected(profile: Profile): AppNotification {
  return createNotification(profile.id, 'profile_rejected', {
    title_uk: 'Профіль відхилено',
    title_ro: 'Profil respins',
    title_en: 'Profile rejected',
    body_uk: 'На жаль, ваш профіль не пройшов перевірку. Зверніться до адміністратора.',
    body_ro: 'Din păcate, profilul dvs. nu a trecut verificarea. Contactați administratorul.',
    body_en: 'Your profile did not pass verification. Please contact the administrator.',
    link: '/cabinet',
  });
}

export function notifyListingApproved(userId: string, title: string): AppNotification {
  return createNotification(userId, 'listing_approved', {
    title_uk: 'Оголошення схвалено',
    title_ro: 'Anunț aprobat',
    title_en: 'Listing approved',
    body_uk: `«${title}» опубліковано.`,
    body_ro: `«${title}» a fost publicat.`,
    body_en: `«${title}» is now live.`,
    link: '/cabinet',
  });
}

// NEW: notification when listing is rejected, with optional reason
export function notifyListingRejected(
  userId: string,
  title: string,
  reason?: string | null
): AppNotification {
  const reasonText = reason ? ` Причина: ${reason}` : '';
  return createNotification(userId, 'listing_rejected', {
    title_uk: 'Оголошення відхилено',
    title_ro: 'Anunț respins',
    title_en: 'Listing rejected',
    body_uk: `«${title}» не пройшло модерацію.${reasonText}`,
    body_ro: `«${title}» nu a trecut moderarea.${reasonText}`,
    body_en: `«${title}» did not pass moderation.${reasonText}`,
    link: '/cabinet',
  });
}

// NEW: notification when a new review is received on a listing
export function notifyReviewReceived(
  listingOwnerId: string,
  listingTitle: string,
  listingId: string
): AppNotification {
  return createNotification(listingOwnerId, 'review_received', {
    title_uk: 'Новий відгук',
    title_ro: 'Recenzie nouă',
    title_en: 'New review',
    body_uk: `Хтось залишив відгук про «${listingTitle}».`,
    body_ro: `Cineva a lăsat o recenzie pentru «${listingTitle}».`,
    body_en: `Someone left a review for «${listingTitle}».`,
    link: `/listing/${listingId}`,
  });
}

export function notifyChatMessage(
  userIds: string[],
  senderName: string,
  excludeUserId: string
): AppNotification[] {
  return userIds
    .filter((id) => id !== excludeUserId)
    .map((userId) =>
      createNotification(userId, 'chat_message', {
        title_uk: 'Нове повідомлення в чаті',
        title_ro: 'Mesaj nou în chat',
        title_en: 'New chat message',
        body_uk: `${senderName} написав(ла) у спільному чаті.`,
        body_ro: `${senderName} a scris în chatul comunității.`,
        body_en: `${senderName} posted in community chat.`,
        link: '/chat',
      })
    );
}

export function getLocalizedNotification(n: AppNotification, lang: string) {
  const key = lang === 'ro' ? 'ro' : lang === 'en' ? 'en' : 'uk';
  return {
    title:
      key === 'ro' ? n.title_ro : key === 'en' ? n.title_en : n.title_uk,
    body: key === 'ro' ? n.body_ro : key === 'en' ? n.body_en : n.body_uk,
  };
}
