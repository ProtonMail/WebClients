import { readScopedLocalStorageJson, writeScopedLocalStorageJson } from './lumoScopedLocalStorage';

const APERTUS_ANNOUNCEMENT_KEY = 'lumo-apertus-announcement';

export const hasDismissedApertusAnnouncement = (): boolean => {
    const stored = readScopedLocalStorageJson<{ dismissed?: boolean } | null>(APERTUS_ANNOUNCEMENT_KEY, null);
    return stored?.dismissed === true;
};

export const markApertusAnnouncementDismissed = (): void => {
    writeScopedLocalStorageJson(APERTUS_ANNOUNCEMENT_KEY, {
        dismissed: true,
        dismissedAt: Date.now(),
    });
};
