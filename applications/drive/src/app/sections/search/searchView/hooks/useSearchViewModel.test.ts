import { IndexKind } from '../../../../modules/search';
import type { SearchResultItem } from '../../../../modules/search';
import { mergeAndSortResults } from './useSearchViewModel';

const resultItem = (nodeUid: string, score: number, indexKind = IndexKind.MAIN): SearchResultItem => ({
    nodeUid,
    score,
    indexKind,
});

describe('mergeAndSortResults', () => {
    it('returns empty array for no results', () => {
        expect(mergeAndSortResults([])).toEqual([]);
    });

    it('sorts by descending score', () => {
        const results = [resultItem('nodeuid-1', 0.1), resultItem('nodeuid-2', 0.3), resultItem('nodeuid-3', 0.2)];
        expect(mergeAndSortResults(results)).toEqual(['nodeuid-2', 'nodeuid-3', 'nodeuid-1']);
    });

    it('deduplicates keeping the highest score', () => {
        const results = [resultItem('nodeuid-1', 0.1), resultItem('nodeuid-1', 0.5), resultItem('nodeuid-1', 0.3)];
        expect(mergeAndSortResults(results)).toEqual(['nodeuid-1']);
    });

    it('deduplicates one item and sorts the rest', () => {
        const results = [
            resultItem('nodeuid-1', 0.2),
            resultItem('nodeuid-2', 0.4),
            resultItem('nodeuid-1', 0.6),
            resultItem('nodeuid-3', 0.5),
        ];
        // nodeuid-1 deduped to 0.6, then sorted: nodeuid-1 (0.6), nodeuid-3 (0.5), nodeuid-2 (0.4)
        expect(mergeAndSortResults(results)).toEqual(['nodeuid-1', 'nodeuid-3', 'nodeuid-2']);
    });

    it('breaks score ties by nodeUid alphabetically', () => {
        const results = [resultItem('nodeuid-3', 0.5), resultItem('nodeuid-1', 0.5), resultItem('nodeuid-2', 0.5)];
        expect(mergeAndSortResults(results)).toEqual(['nodeuid-1', 'nodeuid-2', 'nodeuid-3']);
    });
});
