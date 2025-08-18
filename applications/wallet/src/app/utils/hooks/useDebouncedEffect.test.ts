import { waitFor } from '@testing-library/react';
import { renderHook } from '@testing-library/react-hooks';

import { useDebounceEffect } from './useDebouncedEffect';

describe('useDebouncedEffect', () => {
    const date = 1713516247000;

    beforeEach(() => {
        vitest.useFakeTimers({ now: date, shouldAdvanceTime: true });
        vitest.setSystemTime(new Date(date));
    });

    afterEach(() => {
        vitest.useRealTimers();
    });

    it('should debounce effect', async () => {
        let dep = 0;

        const effect = vi.fn();

        const { rerender } = renderHook(() => useDebounceEffect(() => effect(dep), [dep], 500));
        dep = 1;
        rerender();
        dep = 2;
        rerender();
        dep = 3;
        rerender();
        dep = 4;
        rerender();

        vitest.runAllTimers();

        await waitFor(() => {
            expect(effect).toHaveBeenCalledTimes(1);
        });

        expect(effect).toHaveBeenCalledWith(dep);
    });

    describe('when hook is unmounted', () => {
        it('should cancel debounce', async () => {
            let dep = 0;

            const cleanup = vi.fn();
            // eslint-disable-next-line @typescript-eslint/no-unused-vars
            const effect = vi.fn((_dep: number) => cleanup);

            const { rerender, unmount } = renderHook(() => useDebounceEffect(() => effect(dep), [dep], 500));
            dep = 1;
            rerender();
            dep = 2;
            rerender();

            unmount();

            vitest.runAllTimers();

            await waitFor(() => {
                expect(effect).toHaveBeenCalledTimes(0);
            });
        });

        it('should cleanup', async () => {
            let dep = 0;

            const cleanup = vi.fn();
            // eslint-disable-next-line @typescript-eslint/no-unused-vars
            const effect = vi.fn((_dep: number) => cleanup);

            const { rerender, unmount } = renderHook(() => useDebounceEffect(() => effect(dep), [dep], 500));
            dep = 1;
            rerender();
            dep = 2;
            rerender();

            vitest.runAllTimers();

            await waitFor(() => {
                expect(effect).toHaveBeenCalledTimes(1);
            });

            unmount();

            expect(cleanup).toHaveBeenCalledTimes(1);
        });
    });
});
