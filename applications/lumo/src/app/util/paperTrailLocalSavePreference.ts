import { getLumoScopedStorageKey } from './lumoScopedLocalStorage';

const SAVE_LOCALLY_KEY = 'lumo-ai-paper-trail-save-locally';
const RECENT_FILES_KEY = 'lumo-ai-paper-trail-recent';
const REPORTS_KEY = 'lumo-ai-paper-trail-reports';
const PAPER_TRAIL_KEY_STORAGE_KEY = 'lumo-ai-paper-trail-key';

const readPreferenceRecord = (): { enabled?: boolean } | null => {
    try {
        if (typeof window === 'undefined') {
            return null;
        }
        const stored = localStorage.getItem(getLumoScopedStorageKey(SAVE_LOCALLY_KEY));
        if (!stored) {
            return null;
        }
        return JSON.parse(stored) as { enabled?: boolean };
    } catch {
        return null;
    }
};

const hasExistingPaperTrailData = (): boolean => {
    if (typeof window === 'undefined') {
        return false;
    }
    return (
        localStorage.getItem(getLumoScopedStorageKey(RECENT_FILES_KEY)) !== null ||
        localStorage.getItem(getLumoScopedStorageKey(REPORTS_KEY)) !== null
    );
};

const writePreferenceRecord = (enabled: boolean): void => {
    if (typeof window === 'undefined') {
        return;
    }
    localStorage.setItem(getLumoScopedStorageKey(SAVE_LOCALLY_KEY), JSON.stringify({ enabled }));
};

const clearPaperTrailLocalData = (): void => {
    if (typeof window === 'undefined') {
        return;
    }
    localStorage.removeItem(getLumoScopedStorageKey(RECENT_FILES_KEY));
    localStorage.removeItem(getLumoScopedStorageKey(REPORTS_KEY));
    localStorage.removeItem(getLumoScopedStorageKey(PAPER_TRAIL_KEY_STORAGE_KEY));
};

/** Users must opt in before paper trail reports are written to localStorage. */
export const isPaperTrailLocalSaveEnabled = (): boolean => {
    const preference = readPreferenceRecord();
    if (preference !== null) {
        return preference.enabled === true;
    }

    // Migration: auto-save existed before this opt-in preference was added.
    return hasExistingPaperTrailData();
};

export const setPaperTrailLocalSaveEnabled = (enabled: boolean): void => {
    writePreferenceRecord(enabled);
    if (!enabled) {
        clearPaperTrailLocalData();
    }
};

export const shouldPersistPaperTrailLocally = (): boolean => isPaperTrailLocalSaveEnabled();
