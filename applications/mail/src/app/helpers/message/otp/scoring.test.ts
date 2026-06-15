import { predictStrict, scoreCodes } from './scoring';

describe('OTP scoring', () => {
    describe('scoreCodes', () => {
        it('tallies a code across extractors, weighted by each extractor', () => {
            const scores = scoreCodes({ a: ['111'], b: ['111'] }, { a: 2, b: 3 });
            expect(scores).toEqual({ '111': 5 });
        });

        it('only tallies extractors present in perExtractor (gating is upstream)', () => {
            // scoreCodes is a pure weighted tally: an extractor absent from
            // perExtractor — e.g. a weight-0 one the facade never ran — contributes
            // nothing, even when it carries a weight entry.
            const scores = scoreCodes({ a: ['111'] }, { a: 5, b: 3 });
            expect(scores).toEqual({ '111': 5 });
        });

        it('returns an empty tally when no extractors produced candidates', () => {
            const scores = scoreCodes({}, { a: 5 });
            expect(scores).toEqual({});
        });
    });

    describe('predictStrict', () => {
        it('returns null when there are no candidates', () => {
            expect(predictStrict({})).toBeNull();
        });

        it('returns the unique highest-scoring code', () => {
            expect(predictStrict({ a: 5, b: 3 })).toBe('a');
        });

        it('returns null on a tie for the top score', () => {
            expect(predictStrict({ a: 5, b: 5 })).toBeNull();
        });
    });
});
