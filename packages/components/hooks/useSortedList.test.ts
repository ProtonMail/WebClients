import { act, renderHook } from '@testing-library/react-hooks';

import { SORT_DIRECTION } from '@proton/shared/lib/constants';

import useSortedList from './useSortedList';

describe('useSortedList hook', () => {
    it('should return sorted list initially if config is provided', () => {
        const list = [{ t: 2 }, { t: 3 }, { t: 1 }];
        const { result } = renderHook(() => useSortedList(list, { key: 't', direction: SORT_DIRECTION.DESC }));
        expect(result.current.sortedList).toEqual([{ t: 3 }, { t: 2 }, { t: 1 }]);
        expect(result.current.sortConfig).toEqual({ key: 't', direction: SORT_DIRECTION.DESC });
    });

    it('should not sort initially if no config is provided', () => {
        const list = [{ t: 2 }, { t: 3 }, { t: 1 }];
        const { result } = renderHook(() => useSortedList(list));
        expect(result.current.sortedList).toEqual(list);
        expect(result.current.sortConfig).toBeUndefined();
    });

    it('should set initialize sorting config on sort when none was provided', () => {
        const list = [{ t: 2 }, { t: 3 }, { t: 1 }];
        const { result } = renderHook(() => useSortedList(list));
        act(() => result.current.toggleSort('t'));
        expect(result.current.sortedList).toEqual([{ t: 1 }, { t: 2 }, { t: 3 }]);
        expect(result.current.sortConfig).toEqual({ key: 't', direction: SORT_DIRECTION.ASC });
    });

    it('should toggle sort direction for the same key', () => {
        const list = [{ t: 2 }, { t: 3 }, { t: 1 }];
        const { result } = renderHook(() => useSortedList(list, { key: 't', direction: SORT_DIRECTION.ASC }));
        expect(result.current.sortedList).toEqual([{ t: 1 }, { t: 2 }, { t: 3 }]);
        expect(result.current.sortConfig).toEqual({ key: 't', direction: SORT_DIRECTION.ASC });

        act(() => result.current.toggleSort('t'));

        expect(result.current.sortedList).toEqual([{ t: 3 }, { t: 2 }, { t: 1 }]);
        expect(result.current.sortConfig).toEqual({ key: 't', direction: SORT_DIRECTION.DESC });
    });

    it('should change sort key and set direction to ascending for another key', () => {
        const list = [
            { t: 2, k: 'c' },
            { t: 3, k: 'b' },
            { t: 1, k: 'a' },
        ];
        const { result } = renderHook(() => useSortedList(list, { key: 't', direction: SORT_DIRECTION.ASC }));
        expect(result.current.sortedList).toEqual([
            { t: 1, k: 'a' },
            { t: 2, k: 'c' },
            { t: 3, k: 'b' },
        ]);
        expect(result.current.sortConfig).toEqual({ key: 't', direction: SORT_DIRECTION.ASC });

        act(() => result.current.toggleSort('k'));

        expect(result.current.sortedList).toEqual([
            { t: 1, k: 'a' },
            { t: 3, k: 'b' },
            { t: 2, k: 'c' },
        ]);
        expect(result.current.sortConfig).toEqual({ key: 'k', direction: SORT_DIRECTION.ASC });
    });

    it('should use initial compare when switching back to the initial key after sorting by another column', () => {
        const list = [
            { ID: 1, Load: 10 },
            { ID: 10, Load: 5 },
            { ID: 2, Load: 20 },
        ];
        const numericCompare = (a: number, b: number) => a - b;
        const { result } = renderHook(() =>
            useSortedList(list, { key: 'ID', direction: SORT_DIRECTION.ASC, compare: numericCompare })
        );
        expect(result.current.sortedList.map((r) => r.ID)).toEqual([1, 2, 10]);

        act(() => result.current.toggleSort('Load'));

        expect(result.current.sortConfig?.key).toBe('Load');

        act(() => result.current.toggleSort('ID'));

        expect(result.current.sortedList.map((r) => r.ID)).toEqual([1, 2, 10]);
        expect(result.current.sortConfig?.compare).toBe(numericCompare);
    });
});
