const DISMISS_STORAGE_KEY = 'lumo-model-switch-notification-dismissed';
const LEGACY_DISMISS_STORAGE_PREFIX = 'lumo-model-switch-notification-';

export const hasDismissedModelSwitchNotification = (): boolean => {
    try {
        if (sessionStorage.getItem(DISMISS_STORAGE_KEY) === '1') {
            return true;
        }

        // Preserve dismissals written by the former per-conversation implementation.
        for (let index = 0; index < sessionStorage.length; index += 1) {
            const key = sessionStorage.key(index);
            if (
                key?.startsWith(LEGACY_DISMISS_STORAGE_PREFIX) &&
                key !== DISMISS_STORAGE_KEY &&
                sessionStorage.getItem(key) === '1'
            ) {
                return true;
            }
        }

        return false;
    } catch {
        return false;
    }
};

export const markModelSwitchNotificationDismissed = (): void => {
    try {
        sessionStorage.setItem(DISMISS_STORAGE_KEY, '1');
    } catch {
        // Fail silently if sessionStorage is unavailable.
    }
};
