export type SuggestedModel = 'lumo-lite' | 'apertus-15';

const getDismissStorageKey = (model: SuggestedModel) => `lumo-model-switch-notification-dismissed-${model}`;

export const hasDismissedModelSwitchNotification = (model: SuggestedModel): boolean => {
    try {
        return sessionStorage.getItem(getDismissStorageKey(model)) === '1';
    } catch {
        return false;
    }
};

export const markModelSwitchNotificationDismissed = (model: SuggestedModel): void => {
    try {
        sessionStorage.setItem(getDismissStorageKey(model), '1');
    } catch {
        // Fail silently if sessionStorage is unavailable.
    }
};
