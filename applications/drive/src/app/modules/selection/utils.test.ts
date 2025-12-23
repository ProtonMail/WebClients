import { SelectionState } from './types';
import { calculateSelectionState, filterValidSelections, getRangeOfItems } from './utils';

describe('calculateSelectionState', () => {
    it('should return NONE when no items are selected', () => {
        expect(calculateSelectionState(0, 10)).toBe(SelectionState.NONE);
        expect(calculateSelectionState(0, 0)).toBe(SelectionState.NONE);
    });

    it('should return ALL when all items are selected', () => {
        expect(calculateSelectionState(10, 10)).toBe(SelectionState.ALL);
        expect(calculateSelectionState(1, 1)).toBe(SelectionState.ALL);
    });

    it('should return SOME when some items are selected', () => {
        expect(calculateSelectionState(5, 10)).toBe(SelectionState.SOME);
        expect(calculateSelectionState(1, 10)).toBe(SelectionState.SOME);
        expect(calculateSelectionState(9, 10)).toBe(SelectionState.SOME);
    });

    it('should handle edge case where selected > total', () => {
        expect(calculateSelectionState(15, 10)).toBe(SelectionState.SOME);
    });
});

describe('getRangeOfItems', () => {
    const items = ['id1', 'id2', 'id3', 'id4', 'id5'];

    it('should return range from start to end (forward)', () => {
        expect(getRangeOfItems(items, 'id2', 'id4')).toEqual(['id2', 'id3', 'id4']);
    });

    it('should return range from end to start (backward)', () => {
        expect(getRangeOfItems(items, 'id4', 'id2')).toEqual(['id2', 'id3', 'id4']);
    });

    it('should return single item when start equals end', () => {
        expect(getRangeOfItems(items, 'id3', 'id3')).toEqual(['id3']);
    });

    it('should return entire range when selecting from first to last', () => {
        expect(getRangeOfItems(items, 'id1', 'id5')).toEqual(items);
    });

    it('should return just end item when start not found', () => {
        expect(getRangeOfItems(items, 'nonexistent', 'id3')).toEqual(['id3']);
    });

    it('should return just end item when end not found', () => {
        expect(getRangeOfItems(items, 'id2', 'nonexistent')).toEqual(['nonexistent']);
    });

    it('should handle empty items array', () => {
        expect(getRangeOfItems([], 'id1', 'id2')).toEqual(['id2']);
    });

    it('should return adjacent items correctly', () => {
        expect(getRangeOfItems(items, 'id2', 'id3')).toEqual(['id2', 'id3']);
    });
});

describe('filterValidSelections', () => {
    it('should keep only valid selections', () => {
        const selected = new Set(['id1', 'id2', 'id3', 'id4']);
        const current = ['id1', 'id3', 'id5'];

        const result = filterValidSelections(selected, current);

        expect(result).toEqual(new Set(['id1', 'id3']));
    });

    it('should return empty set when no selections are valid', () => {
        const selected = new Set(['id1', 'id2', 'id3']);
        const current = ['id4', 'id5', 'id6'];

        const result = filterValidSelections(selected, current);

        expect(result).toEqual(new Set());
    });

    it('should return all selections when all are valid', () => {
        const selected = new Set(['id1', 'id2', 'id3']);
        const current = ['id1', 'id2', 'id3', 'id4', 'id5'];

        const result = filterValidSelections(selected, current);

        expect(result).toEqual(selected);
    });

    it('should handle empty selected set', () => {
        const selected = new Set<string>();
        const current = ['id1', 'id2', 'id3'];

        const result = filterValidSelections(selected, current);

        expect(result).toEqual(new Set());
    });

    it('should handle empty current items', () => {
        const selected = new Set(['id1', 'id2', 'id3']);
        const current: string[] = [];

        const result = filterValidSelections(selected, current);

        expect(result).toEqual(new Set());
    });

    it('should be order-independent', () => {
        const selected = new Set(['id3', 'id1', 'id2']);
        const current = ['id1', 'id2', 'id3'];

        const result = filterValidSelections(selected, current);

        expect(result.size).toBe(3);
        expect(result.has('id1')).toBe(true);
        expect(result.has('id2')).toBe(true);
        expect(result.has('id3')).toBe(true);
    });
});
