import type { ConversationId } from '../types';

const getDismissStorageKey = (conversationId: ConversationId) => `lumo-guest-notification-${conversationId}`;

export const hasDismissedGuestNotification = (conversationId: ConversationId): boolean => {
    try {
        return sessionStorage.getItem(getDismissStorageKey(conversationId)) === '1';
    } catch {
        return false;
    }
};

export const markGuestNotificationDismissed = (conversationId: ConversationId): void => {
    try {
        sessionStorage.setItem(getDismissStorageKey(conversationId), '1');
    } catch {
        // Fail silently if sessionStorage is unavailable.
    }
};
