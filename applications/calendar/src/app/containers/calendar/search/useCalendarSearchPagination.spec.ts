import { useHistory } from 'react-router-dom';

import { RenderHookResult, act, renderHook } from '@testing-library/react-hooks';

import { mockUseHistory } from '@proton/testing/index';

import { useCalendarSearchPagination } from './useCalendarSearchPagination';

describe('useCalendarSearchPagination', () => {
    let mockHistoryPush: jest.MockedFn<ReturnType<typeof useHistory>['push']>;

    const array = new Array(247).fill(null).map((_, index) => index);

    beforeEach(() => {
        mockHistoryPush = jest.fn();
        mockUseHistory({ push: mockHistoryPush });
    });

    describe('when no maxItemsPerPage is provided', () => {
        let hook: RenderHookResult<unknown, ReturnType<typeof useCalendarSearchPagination>>;

        beforeEach(() => {
            hook = renderHook(() => useCalendarSearchPagination(array));
        });

        it('should return 100 first items', () => {
            const { result } = hook;
            expect(result.current.items).toStrictEqual(
                Array(100)
                    .fill(null)
                    .map((_, index) => index)
            );
            // there is more than 100 remaining items => enable next
            expect(result.current.isNextEnabled).toBe(true);
        });

        it('should handle `next` pagination', () => {
            const { result } = hook;

            act(() => result.current.next());

            expect(result.current.currentPage).toBe(1);
            expect(result.current.items).toStrictEqual(
                Array(100)
                    .fill(null)
                    .map((_, index) => 100 + index)
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
                Array(47)
                    .fill(null)
                    .map((_, index) => 200 + index)
            );
            //  new page has been written to query string
            expect(mockHistoryPush).toHaveBeenCalledTimes(1);
            expect(mockHistoryPush).toHaveBeenCalledWith('/search#page=2');
            // there isn't more than 100 remaining items => disable next
            expect(result.current.isNextEnabled).toBe(false);
        });

        it('should handle `previous` pagination', () => {
            const { result } = hook;
            // current page is first one => disable previous
            expect(result.current.isPreviousEnabled).toBe(false);

            // go to last page
            act(() => result.current.next());
            act(() => result.current.next());
            mockHistoryPush.mockClear();

            expect(result.current.currentPage).toBe(2);
            expect(result.current.items).toStrictEqual(
                Array(47)
                    .fill(null)
                    .map((_, index) => 200 + index)
            );
            // current page is not first one => enable previous
            expect(result.current.isPreviousEnabled).toBe(true);

            act(() => result.current.previous());

            expect(result.current.currentPage).toBe(1);
            expect(result.current.items).toStrictEqual(
                Array(100)
                    .fill(null)
                    .map((_, index) => 100 + index)
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
    });

    describe('when maxItemsPerPage is provided', () => {
        let hook: RenderHookResult<unknown, ReturnType<typeof useCalendarSearchPagination>>;

        beforeEach(() => {
            hook = renderHook(() => useCalendarSearchPagination(array, 40));
        });

        it('should return `maxItemsPerPage` first items', () => {
            const { result } = hook;
            expect(result.current.items).toStrictEqual(
                Array(40)
                    .fill(null)
                    .map((_, index) => index)
            );
            // there is more than 100 remaining items => enable next
            expect(result.current.isNextEnabled).toBe(true);
        });

        it('should increment pagination by `maxItemsPerPage`', () => {
            const { result } = hook;
            act(() => result.current.next());
            expect(result.current.items).toStrictEqual(
                Array(40)
                    .fill(null)
                    .map((_, index) => 40 + index)
            );
        });

        it('should decrement pagination by `maxItemsPerPage`', () => {
            const { result } = hook;
            act(() => result.current.next());

            act(() => result.current.previous());
            expect(result.current.items).toStrictEqual(
                Array(40)
                    .fill(null)
                    .map((_, index) => index)
            );
        });
    });
});
