import type { useHistory } from 'react-router-dom';

import { act, renderHook } from '@testing-library/react-hooks';

import { mockUseHistory } from '@proton/testing';

import { DEFAULT_MAX_ITEMS_PER_PAGE } from './constants';
import type { VisualSearchItem } from './interface';
import { useCalendarSearchPagination } from './useCalendarSearchPagination';

const generateTestVisualItem = (index: number, isClosestToDate = false) => {
    return { UID: index.toString(), isClosestToDate } as VisualSearchItem;
};

describe('useCalendarSearchPagination', () => {
    let mockHistoryPush: jest.MockedFn<ReturnType<typeof useHistory>['push']>;

    const array = new Array(2 * DEFAULT_MAX_ITEMS_PER_PAGE + 2)
        .fill(null)
        .map((_, index) => generateTestVisualItem(index));
    const arrayWithClosestToDate = new Array(2 * DEFAULT_MAX_ITEMS_PER_PAGE + 2)
        .fill(null)
        .map((_, index) => generateTestVisualItem(index, index === DEFAULT_MAX_ITEMS_PER_PAGE + 2));
    const dummyDate = new Date();

    beforeEach(() => {
        mockHistoryPush = jest.fn();
        mockUseHistory({ push: mockHistoryPush });
    });

    describe('when no maxItemsPerPage is provided', () => {
        it('should return 100 first items', () => {
            const { result } = renderHook(() => useCalendarSearchPagination(array, dummyDate));
            expect(result.current.items).toStrictEqual(
                Array(DEFAULT_MAX_ITEMS_PER_PAGE)
                    .fill(null)
                    .map((_, index) => generateTestVisualItem(index))
            );
            // there is more than 100 remaining items => enable next
            expect(result.current.isNextEnabled).toBe(true);
        });

        it('should handle `next` pagination', () => {
            const { result } = renderHook(() => useCalendarSearchPagination(array, dummyDate));

            act(() => result.current.next());

            expect(result.current.currentPage).toBe(1);
            expect(result.current.items).toStrictEqual(
                Array(DEFAULT_MAX_ITEMS_PER_PAGE)
                    .fill(null)
                    .map((_, index) => generateTestVisualItem(DEFAULT_MAX_ITEMS_PER_PAGE + index))
            );
            //  new page has been written to query string
            expect(mockHistoryPush).toHaveBeenCalledTimes(1);
            expect(mockHistoryPush).toHaveBeenCalledWith('/search#page=1');
            // there is more than 100 remaining items => enable next
            expect(result.current.isNextEnabled).toBe(true);

            mockHistoryPush.mockClear();
            act(() => result.current.next());

            expect(result.current.currentPage).toBe(2);
            expect(result.current.items).toStrictEqual(
                Array(2)
                    .fill(null)
                    .map((_, index) => generateTestVisualItem(2 * DEFAULT_MAX_ITEMS_PER_PAGE + index))
            );
            //  new page has been written to query string
            expect(mockHistoryPush).toHaveBeenCalledTimes(1);
            expect(mockHistoryPush).toHaveBeenCalledWith('/search#page=2');
            // there isn't more than 100 remaining items => disable next
            expect(result.current.isNextEnabled).toBe(false);
        });

        it('should handle `previous` pagination', () => {
            const { result } = renderHook(() => useCalendarSearchPagination(array, dummyDate));
            // current page is first one => disable previous
            expect(result.current.isPreviousEnabled).toBe(false);

            // go to last page
            act(() => result.current.next());
            act(() => result.current.next());
            mockHistoryPush.mockClear();

            expect(result.current.currentPage).toBe(2);
            expect(result.current.items).toStrictEqual(
                Array(2)
                    .fill(null)
                    .map((_, index) => generateTestVisualItem(2 * DEFAULT_MAX_ITEMS_PER_PAGE + index))
            );
            // current page is not first one => enable previous
            expect(result.current.isPreviousEnabled).toBe(true);

            act(() => result.current.previous());

            expect(result.current.currentPage).toBe(1);
            expect(result.current.items).toStrictEqual(
                Array(DEFAULT_MAX_ITEMS_PER_PAGE)
                    .fill(null)
                    .map((_, index) => generateTestVisualItem(DEFAULT_MAX_ITEMS_PER_PAGE + index))
            );
            //  new page has been written to query string
            expect(mockHistoryPush).toHaveBeenCalledTimes(1);
            expect(mockHistoryPush).toHaveBeenCalledWith('/search#page=1');
            // current page is still not first one => enable previous
            expect(result.current.isPreviousEnabled).toBe(true);

            mockHistoryPush.mockClear();
            act(() => result.current.previous());

            // current page is back to first one => disable previous
            expect(result.current.isPreviousEnabled).toBe(false);
            expect(result.current.currentPage).toBe(0);
            //  new page has been written to query string
            expect(mockHistoryPush).toHaveBeenCalledTimes(1);
            expect(mockHistoryPush).toHaveBeenCalledWith('/search');
        });

        it('should compute maxPage correctly when the number of search items is a multiple of the page size', () => {
            // array of search items whose length is twice the page size => we should have two pages of results
            const arrayIsMultiple = new Array(2 * DEFAULT_MAX_ITEMS_PER_PAGE)
                .fill(null)
                .map((_, index) => generateTestVisualItem(index));
            const { result } = renderHook(() => useCalendarSearchPagination(arrayIsMultiple, dummyDate));

            // current page is first one => previous should be disabled, next enabled
            expect(result.current.currentPage).toBe(0);
            expect(result.current.isPreviousEnabled).toBe(false);
            expect(result.current.isNextEnabled).toBe(true);

            // go to second page
            act(() => result.current.next());
            mockHistoryPush.mockClear();

            // current page is second one => previous should be enabled, next disabled
            expect(result.current.currentPage).toBe(1);
            expect(result.current.isNextEnabled).toBe(false);
            expect(result.current.isPreviousEnabled).toBe(true);
        });
    });

    describe('when maxItemsPerPage is provided', () => {
        it('should return `maxItemsPerPage` first items', () => {
            const { result } = renderHook(() => useCalendarSearchPagination(array, dummyDate, 40));

            expect(result.current.items).toStrictEqual(
                Array(40)
                    .fill(null)
                    .map((_, index) => generateTestVisualItem(index))
            );
            // there is more than 100 remaining items => enable next
            expect(result.current.isNextEnabled).toBe(true);
        });

        it('should increment pagination by `maxItemsPerPage`', () => {
            const { result } = renderHook(() => useCalendarSearchPagination(array, dummyDate, 40));

            act(() => result.current.next());
            expect(result.current.items).toStrictEqual(
                Array(40)
                    .fill(null)
                    .map((_, index) => generateTestVisualItem(40 + index))
            );
        });

        it('should decrement pagination by `maxItemsPerPage`', () => {
            const { result } = renderHook(() => useCalendarSearchPagination(array, dummyDate, 40));

            act(() => result.current.next());

            act(() => result.current.previous());
            expect(result.current.items).toStrictEqual(
                Array(40)
                    .fill(null)
                    .map((_, index) => generateTestVisualItem(index))
            );
        });
    });

    describe('when an item is marked as closest to date', () => {
        it('should return the page with the item closest to date', () => {
            const { result } = renderHook(() => useCalendarSearchPagination(arrayWithClosestToDate, dummyDate));

            expect(result.current.items).toStrictEqual(
                Array(DEFAULT_MAX_ITEMS_PER_PAGE)
                    .fill(null)
                    .map((_, index) => generateTestVisualItem(DEFAULT_MAX_ITEMS_PER_PAGE + index, index === 2))
            );
            // there is more than 100 remaining items => enable next
            expect(result.current.isNextEnabled).toBe(true);
        });
    });
});
