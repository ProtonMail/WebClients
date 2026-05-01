import { readScopedLocalStorageJson, writeScopedLocalStorageJson } from './lumoScopedLocalStorage';

const NOTIFICATION_PANEL_KEY = 'lumo-survey-notification-panel';

export const hasDismissedNotificationPanel = (): boolean => {
    const parsed = readScopedLocalStorageJson<{ dismissed?: boolean } | null>(NOTIFICATION_PANEL_KEY, null);
    return parsed?.dismissed === true;
};

export const markNotificationPanelDismissed = (): void => {
    writeScopedLocalStorageJson(NOTIFICATION_PANEL_KEY, { dismissed: true, dismissedAt: Date.now() });
};
