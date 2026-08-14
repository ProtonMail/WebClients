import type { ConversationId } from '../types';

const getDismissStorageKey = (conversationId: ConversationId) => `lumo-model-switch-notification-${conversationId}`;

export const hasDismissedModelSwitchNotification = (conversationId: ConversationId): boolean => {
    try {
        return sessionStorage.getItem(getDismissStorageKey(conversationId)) === '1';
    } catch {
        return false;
    }
};

export const markModelSwitchNotificationDismissed = (conversationId: ConversationId): void => {
    try {
        sessionStorage.setItem(getDismissStorageKey(conversationId), '1');
    } catch {
        // Fail silently if sessionStorage is unavailable.
    }
};
