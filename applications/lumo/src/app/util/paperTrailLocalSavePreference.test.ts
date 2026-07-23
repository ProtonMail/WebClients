import { getLumoScopedStorageKey } from './lumoScopedLocalStorage';
import {
    isPaperTrailLocalSaveEnabled,
    setPaperTrailLocalSaveEnabled,
    shouldPersistPaperTrailLocally,
} from './paperTrailLocalSavePreference';

const SAVE_LOCALLY_KEY = 'lumo-ai-paper-trail-save-locally';
const RECENT_FILES_KEY = 'lumo-ai-paper-trail-recent';
const REPORTS_KEY = 'lumo-ai-paper-trail-reports';

describe('paperTrailLocalSavePreference', () => {
    beforeEach(() => {
        localStorage.clear();
        Object.defineProperty(window, 'location', {
            configurable: true,
            value: { ...window.location, pathname: '/guest/ai-paper-trail' },
        });
    });

    it('requires opt-in before persisting locally', () => {
        expect(isPaperTrailLocalSaveEnabled()).toBe(false);
        expect(shouldPersistPaperTrailLocally()).toBe(false);
    });

    it('enables local save when the user opts in', () => {
        setPaperTrailLocalSaveEnabled(true);

        expect(localStorage.getItem(getLumoScopedStorageKey(SAVE_LOCALLY_KEY))).toContain('"enabled":true');
        expect(isPaperTrailLocalSaveEnabled()).toBe(true);
    });

    it('clears paper trail data when local save is disabled', () => {
        localStorage.setItem(getLumoScopedStorageKey(RECENT_FILES_KEY), '[]');
        localStorage.setItem(getLumoScopedStorageKey(REPORTS_KEY), '{}');
        setPaperTrailLocalSaveEnabled(true);
        setPaperTrailLocalSaveEnabled(false);

        expect(localStorage.getItem(getLumoScopedStorageKey(RECENT_FILES_KEY))).toBeNull();
        expect(localStorage.getItem(getLumoScopedStorageKey(REPORTS_KEY))).toBeNull();
        expect(isPaperTrailLocalSaveEnabled()).toBe(false);
    });

    it('treats existing paper trail data as enabled until the user opts out', () => {
        localStorage.setItem(getLumoScopedStorageKey(RECENT_FILES_KEY), '[]');

        expect(isPaperTrailLocalSaveEnabled()).toBe(true);
    });
});
