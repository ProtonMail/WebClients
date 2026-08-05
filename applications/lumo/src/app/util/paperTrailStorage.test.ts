import { LUMO_ROUTES } from '../entrypoint/lumoRoutes';
import { setPaperTrailLocalSaveEnabled } from './paperTrailLocalSavePreference';
import { getPaperTrailReport, savePaperTrailReport } from './paperTrailReportStorage';
import { readPaperTrailStorage, writePaperTrailStorage } from './paperTrailStorage';

const STORAGE_KEY = 'lumo-ai-paper-trail-test';

describe('paperTrailStorage', () => {
    beforeEach(() => {
        localStorage.clear();
        Object.defineProperty(window, 'location', {
            configurable: true,
            value: { ...window.location, pathname: LUMO_ROUTES.AI_PAPER_TRAIL },
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

    it('reads existing data when local save is disabled', () => {
        setPaperTrailLocalSaveEnabled(true);
        writePaperTrailStorage(STORAGE_KEY, { kept: true });
        setPaperTrailLocalSaveEnabled(false);

        expect(readPaperTrailStorage(STORAGE_KEY, {})).toEqual({ kept: true });
    });

    it('does not persist new reports when local save is disabled', () => {
        setPaperTrailLocalSaveEnabled(false);

        savePaperTrailReport('123', {
            name: '',
            label: 'Test',
            quickFacts: [],
            summary: '',
            dataPointCount: 0,
            estimatedValueUsd: 0,
            valueRationale: '',
            sections: [],
            revealingDataPoints: [],
            sensitiveCategories: [],
            dataExposure: [],
            complianceRisks: [],
        });

        expect(getPaperTrailReport('123')).toBeUndefined();
    });
});
