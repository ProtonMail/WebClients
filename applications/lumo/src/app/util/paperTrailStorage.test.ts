import { setPaperTrailLocalSaveEnabled } from './paperTrailLocalSavePreference';
import { readPaperTrailStorage, writePaperTrailStorage } from './paperTrailStorage';

const STORAGE_KEY = 'lumo-ai-paper-trail-test';

describe('paperTrailStorage', () => {
    beforeEach(() => {
        localStorage.clear();
        Object.defineProperty(window, 'location', {
            configurable: true,
            value: { ...window.location, pathname: '/guest/ai-paper-trail' },
        });
    });

    it('stores paper trail data as scoped plaintext JSON when local save is enabled', () => {
        setPaperTrailLocalSaveEnabled(true);
        const payload = { reports: { '789': { headline: 'guest report' } } };

        writePaperTrailStorage(STORAGE_KEY, payload);
        const stored = localStorage.getItem(STORAGE_KEY);

        expect(stored).toBeTruthy();
        expect(stored).not.toMatch(/^enc:v1:/);
        expect(stored).toContain('guest report');

        expect(readPaperTrailStorage(STORAGE_KEY, {})).toEqual(payload);
    });

    it('returns fallback when local save is disabled', () => {
        setPaperTrailLocalSaveEnabled(false);

        expect(readPaperTrailStorage(STORAGE_KEY, { empty: true })).toEqual({ empty: true });
    });

    it('does not write when local save is disabled', () => {
        writePaperTrailStorage(STORAGE_KEY, { saved: true });

        expect(localStorage.getItem(STORAGE_KEY)).toBeNull();
    });
});
