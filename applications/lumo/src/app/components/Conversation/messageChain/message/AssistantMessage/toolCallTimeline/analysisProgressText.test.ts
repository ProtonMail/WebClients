import {
    BIG_FILE_PARTS,
    getAnalysisCount,
    getAnalysisEffortNote,
    getAnalysisLine,
    seedFromId,
} from './analysisProgressText';

const reading = { phase: 'reading', done: 6, total: 18, startedAt: 0 } as const;

describe('analysis progress text', () => {
    it('counts the part being read, and says nothing once merging or for a single part', () => {
        expect(getAnalysisCount(reading)).toBe('Part 7 of 18');
        expect(getAnalysisCount({ ...reading, done: 18 })).toBe('Part 18 of 18');
        expect(getAnalysisCount({ ...reading, phase: 'merging' })).toBeUndefined();
        expect(getAnalysisCount({ ...reading, total: 1, done: 0 })).toBeUndefined();
    });

    it('says a file is a lot of work only when it is long', () => {
        expect(getAnalysisEffortNote({ total: BIG_FILE_PARTS })).toContain('a big one');
        expect(getAnalysisEffortNote({ total: BIG_FILE_PARTS - 1 })).toBeUndefined();
    });

    it('changes line over time, differently per run, and has its own lines for merging', () => {
        const lines = new Set(Array.from({ length: 8 }, (_, tick) => getAnalysisLine(reading, tick, 3)));
        expect(lines.size).toBeGreaterThan(4);

        expect(getAnalysisLine(reading, 2, 3)).toBe(getAnalysisLine(reading, 2, 3));
        expect(getAnalysisLine(reading, 0, 1)).not.toBe(getAnalysisLine(reading, 0, 2));
        expect(getAnalysisLine({ phase: 'merging' }, 0, 0)).not.toBe(getAnalysisLine(reading, 0, 0));
    });

    it('turns an id into a stable number, and copes with none', () => {
        expect(seedFromId('call_1')).toBe(seedFromId('call_1'));
        expect(seedFromId('call_1')).not.toBe(seedFromId('call_2'));
        expect(seedFromId(undefined)).toBe(0);
    });
});
