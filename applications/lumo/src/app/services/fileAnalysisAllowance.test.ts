import {
    FileAnalysisLimitError,
    clearFileAnalysisLimitNotice,
    createFileAnalysisAllowance,
    findFileAnalysisShortfall,
    getFileAnalysisLimitNotice,
    isFileAnalysisLimitError,
    setFileAnalysisLimitNotice,
} from './fileAnalysisAllowance';
import { setRemainingLimits } from './usageLimitsStore';

jest.mock('../util/userAgent', () => ({
    canUseNewModel: jest.fn(() => true),
    canUsePreviewModel: jest.fn(() => true),
}));

const { canUseNewModel, canUsePreviewModel } = jest.requireMock('../util/userAgent');

const check = (overrides: Partial<Parameters<typeof findFileAnalysisShortfall>[0]> = {}) => {
    return findFileAnalysisShortfall({
        fileNames: ['report.pdf'],
        analysisCalls: 12,
        hasLumoPlus: false,
        modelTier: 'lumo-max',
        ...overrides,
    });
};

describe('findFileAnalysisShortfall', () => {
    it('reports the shortfall when the reading needs more Lite questions than are left', () => {
        setRemainingLimits({ lite: 4, max: 10 });

        expect(check()).toEqual({ fileNames: ['report.pdf'], needed: 12, remaining: 4 });
    });

    it('counts the reply too when it is sent on a Lite-pool model', () => {
        setRemainingLimits({ lite: 12, max: 10 });

        expect(check({ modelTier: 'lumo-max' })).toBeUndefined();
        expect(check({ modelTier: 'lumo-lite' })).toEqual({ fileNames: ['report.pdf'], needed: 13, remaining: 12 });
        expect(check({ modelTier: 'apertus-15' })?.needed).toBe(13);
    });

    it('counts the reply the way it is really sent when the picked tier is not available on this client', () => {
        setRemainingLimits({ lite: 12, max: 10 });

        // The preview model is picked but cannot be used here, so the reply goes out as lumo-lite.
        canUsePreviewModel.mockReturnValueOnce(false);
        expect(check({ modelTier: 'lumo-preview' })?.needed).toBe(13);

        // An older client only has max and lite.
        canUseNewModel.mockReturnValueOnce(false);
        expect(check({ modelTier: 'apertus-15' })?.needed).toBe(13);

        // The preview model is usable: it is not in the Lite pool.
        expect(check({ modelTier: 'lumo-preview' })).toBeUndefined();
    });

    it('lets the reading go ahead when it fits', () => {
        setRemainingLimits({ lite: 20, max: 0 });

        expect(check({ modelTier: 'lumo-lite' })).toBeUndefined();
    });

    it('never stops Lumo Plus, a send with nothing to read, or a send whose limits are not known', () => {
        setRemainingLimits({ lite: 0, max: 0 });
        expect(check({ hasLumoPlus: true })).toBeUndefined();
        expect(check({ analysisCalls: 0 })).toBeUndefined();

        setRemainingLimits({ max: 10 });
        expect(check()).toBeUndefined();
    });
});

describe('createFileAnalysisAllowance', () => {
    it('counts what the send already spent, so a second reading cannot use the same questions', () => {
        setRemainingLimits({ lite: 10, max: 10 });
        const allowance = createFileAnalysisAllowance({ hasLumoPlus: false, modelTier: 'lumo-max' });

        expect(allowance(['a.pdf'], 6)).toBeUndefined();
        expect(allowance(['b.pdf'], 6)).toEqual({ fileNames: ['b.pdf'], needed: 6, remaining: 4 });
        // A refused reading is not counted: a smaller one still fits.
        expect(allowance(['c.pdf'], 4)).toBeUndefined();
        expect(allowance(['d.pdf'], 1)).toEqual({ fileNames: ['d.pdf'], needed: 1, remaining: 0 });
    });

    it('counts the reply on a Lite-pool model in every check, but only spends the reading', () => {
        setRemainingLimits({ lite: 10, max: 10 });
        const allowance = createFileAnalysisAllowance({ hasLumoPlus: false, modelTier: 'lumo-lite' });

        expect(allowance(['a.pdf'], 5)).toBeUndefined();
        expect(allowance(['b.pdf'], 5)).toEqual({ fileNames: ['b.pdf'], needed: 6, remaining: 5 });
        expect(allowance(['c.pdf'], 4)).toBeUndefined();
    });

    it('starts counting again when fresh limits arrive, since they already include what was spent', () => {
        setRemainingLimits({ lite: 10, max: 10 });
        const allowance = createFileAnalysisAllowance({ hasLumoPlus: false, modelTier: 'lumo-max' });

        expect(allowance(['a.pdf'], 6)).toBeUndefined();
        // The next round of the reply reports what the backend has left after the reading.
        setRemainingLimits({ lite: 4, max: 10 });
        expect(allowance(['b.pdf'], 3)).toBeUndefined();
        // Within the same round, the second reading still counts against the first.
        expect(allowance(['c.pdf'], 2)).toEqual({ fileNames: ['c.pdf'], needed: 2, remaining: 1 });
    });

    it('counts merge calls like reading calls', () => {
        setRemainingLimits({ lite: 10, max: 10 });
        const allowance = createFileAnalysisAllowance({ hasLumoPlus: false, modelTier: 'lumo-lite' });

        expect(allowance(['a.pdf'], 6)).toBeUndefined();
        // Merging 3 batches fits: 6 + 3 leaves one question for the reply.
        expect(allowance([], 3)).toBeUndefined();
        // Nothing more fits without spending the reply's question.
        expect(allowance([], 1)).toEqual({ fileNames: [], needed: 2, remaining: 1 });
    });

    it('never refuses Lumo Plus', () => {
        setRemainingLimits({ lite: 0, max: 0 });
        const allowance = createFileAnalysisAllowance({ hasLumoPlus: true });

        expect(allowance(['a.pdf'], 30)).toBeUndefined();
    });
});

describe('file analysis limit notice', () => {
    it('is kept per conversation until cleared', () => {
        const shortfall = { fileNames: ['a.pdf'], needed: 5, remaining: 2 };
        setFileAnalysisLimitNotice('c1', shortfall);

        expect(getFileAnalysisLimitNotice('c1')).toEqual({ ...shortfall, stage: 'stopped' });

        setFileAnalysisLimitNotice('c1', shortfall, 'skipped');
        expect(getFileAnalysisLimitNotice('c1')?.stage).toBe('skipped');
        expect(getFileAnalysisLimitNotice('c2')).toBeUndefined();

        clearFileAnalysisLimitNotice('c1');
        expect(getFileAnalysisLimitNotice('c1')).toBeUndefined();
    });

    it('recognises the error that carries the shortfall', () => {
        const error = new FileAnalysisLimitError({ fileNames: ['a.pdf'], needed: 5, remaining: 2 });

        expect(isFileAnalysisLimitError(error)).toBe(true);
        expect(isFileAnalysisLimitError(new Error('other'))).toBe(false);
        expect(error.shortfall.needed).toBe(5);
    });
});
