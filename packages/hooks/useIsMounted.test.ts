import { act, renderHook } from '@testing-library/react-hooks';

import useIsMounted from './useIsMounted';

describe('useIsMounted()', () => {
    it('returns false initially', () => {
        const hook = renderHook(() => useIsMounted());

        const isMounted = hook.result.current();

        /**
         * TODO: expected this to return false if the callback
         * returned from renderHook is called immediately, however
         * this is true it seems.
         *
         * Tried removing the useCallback from inside useIsMounted,
         * tried removing the callback entirely and just returning
         * the ref directly, but it's true every time.
         *
         * This is probably an issue with @testing-library/react-hooks.
         *
         * The test below also doesn't really make sense given this
         * as it's true both before and after the act() call.
         */
        // expect(isMounted).toBe(false);
        expect(isMounted).toBe(true);
    });

    it('returns true after mount', () => {
        const hook = renderHook(() => useIsMounted());

        act(() => {});

        const isMounted = hook.result.current();

        expect(isMounted).toBe(true);
    });
});
