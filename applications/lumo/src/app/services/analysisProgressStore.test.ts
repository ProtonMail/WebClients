import { clearAnalysisProgress, getAnalysisProgress, setAnalysisProgress } from './analysisProgressStore';

describe('analysis progress', () => {
    afterEach(() => {
        clearAnalysisProgress('a');
        clearAnalysisProgress('b');
    });

    it('keeps each call apart, and keeps when it started', () => {
        setAnalysisProgress('a', { phase: 'reading', done: 0, total: 10 });
        const startedAt = getAnalysisProgress('a')!.startedAt;
        setAnalysisProgress('b', { phase: 'reading', done: 3, total: 5 });
        setAnalysisProgress('a', { phase: 'reading', done: 4, total: 10 });

        expect(getAnalysisProgress('a')).toMatchObject({ done: 4, total: 10, startedAt });
        expect(getAnalysisProgress('b')).toMatchObject({ done: 3, total: 5 });
    });

    it('shows nothing for a call it does not know, and forgets finished calls', () => {
        setAnalysisProgress('a', { phase: 'reading', done: 1, total: 2 });
        setAnalysisProgress('b', { phase: 'merging', done: 2, total: 2 });

        expect(getAnalysisProgress(undefined)).toBeUndefined();
        expect(getAnalysisProgress('c')).toBeUndefined();

        clearAnalysisProgress('b');
        expect(getAnalysisProgress('b')).toBeUndefined();
        expect(getAnalysisProgress('a')).toMatchObject({ phase: 'reading', done: 1 });
    });
});
