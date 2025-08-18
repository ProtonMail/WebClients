import { waitFor } from '@testing-library/react';
import { renderHook } from '@testing-library/react-hooks';

import useDebouncedCallback from './useDebouncedCallback';

describe('useDebouncedCallback', () => {
    const date = 1713516247000;

    beforeEach(() => {
        vitest.useFakeTimers({ now: date, shouldAdvanceTime: true });
        vitest.setSystemTime(new Date(date));
    });

    afterEach(() => {
        vitest.useRealTimers();
    });

    it('should debounce callback', async () => {
        const effect = vi.fn();

        const { result } = renderHook(() => useDebouncedCallback((dep) => effect(dep), 500));

        result.current(1);
        result.current(2);
        result.current(3);
        result.current(4);

        vitest.runAllTimers();

        await waitFor(() => {
            expect(effect).toHaveBeenCalledTimes(1);
        });

        expect(effect).toHaveBeenCalledWith(4);
    });

    it('should not call callback if unmount happens before', async () => {
        const effect = vi.fn();

        const { result, unmount } = renderHook(() => useDebouncedCallback((dep) => effect(dep), 500));

        result.current(1);
        result.current(2);
        unmount();

        vitest.runAllTimers();

        await waitFor(() => {
            expect(effect).toHaveBeenCalledTimes(0);
        });
    });
});
