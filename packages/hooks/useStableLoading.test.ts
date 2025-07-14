import { act, renderHook } from '@testing-library/react-hooks';

import { DEFAULT_DELAY, default as useStableLoading } from './useStableLoading';

// hook args type derived from the hook signature
// type HookArgs = Parameters<typeof useStableLoading>;

describe('useStableLoading', () => {
    beforeEach(() => {
        jest.useFakeTimers();
    });

    afterEach(() => {
        jest.useRealTimers();

        // clearing the spies for clearTimeout
        jest.restoreAllMocks();
    });

    it('should initialize with given initial state', () => {
        const { result } = renderHook(() => useStableLoading(false, { initialState: false }));
        expect(result.current).toBe(false);

        const { result: resultTrue } = renderHook(() => useStableLoading(false, { initialState: true }));
        expect(resultTrue.current).toBe(true);
    });

    it('should default to initial state of true', () => {
        const { result } = renderHook(() => useStableLoading(false));
        expect(result.current).toBe(true);
    });

    it('should immediately set loading to true when condition becomes true', () => {
        const { result, rerender } = renderHook(
            (props) =>
                useStableLoading(props, {
                    initialState: false,
                }),
            {
                initialProps: false,
            }
        );

        expect(result.current).toBe(false);

        rerender(true);
        expect(result.current).toBe(true);
    });

    it('should delay setting loading to false when condition becomes false', () => {
        const { result, rerender } = renderHook((props) => useStableLoading(props), {
            initialProps: true,
        });

        // Initially loading
        expect(result.current).toBe(true);

        // Simulate condition becoming false
        rerender(false);

        // Should still be loading immediately after condition changes
        expect(result.current).toBe(true);

        // Advance timers by delay (300ms by default)
        act(() => {
            jest.advanceTimersByTime(DEFAULT_DELAY);
        });

        // Should no longer be loading after delay
        expect(result.current).toBe(false);
    });

    it('should use custom delay when provided', () => {
        const customDelay = 500;
        const { result, rerender } = renderHook((props) => useStableLoading(props, { delay: customDelay }), {
            initialProps: true,
        });

        // Simulate condition becoming false
        rerender(false);

        // Should still be loading after 300ms (default delay)
        act(() => {
            jest.advanceTimersByTime(DEFAULT_DELAY);
        });
        expect(result.current).toBe(true);

        // Should no longer be loading after custom delay
        act(() => {
            jest.advanceTimersByTime(customDelay - DEFAULT_DELAY);
        });
        expect(result.current).toBe(false);
    });

    it('should handle boolean array input correctly', () => {
        const { result, rerender } = renderHook((props) => useStableLoading(props), {
            initialProps: [false, false],
        });

        // Since array has no true values, it should transition to non-loading
        act(() => {
            jest.advanceTimersByTime(DEFAULT_DELAY);
        });
        expect(result.current).toBe(false);

        // If any array value becomes true, loading should be true
        rerender([false, true]);
        expect(result.current).toBe(true);

        // All values become false
        rerender([false, false]);

        // Should still be loading before the delay
        expect(result.current).toBe(true);

        // Should not be loading after the delay
        act(() => {
            jest.advanceTimersByTime(DEFAULT_DELAY);
        });
        expect(result.current).toBe(false);
    });

    it('should handle function input correctly', () => {
        // Create a function that returns false
        const initialFunction = jest.fn().mockReturnValue(false);

        // Render the hook with the function
        const { result, rerender } = renderHook(({ fn }) => useStableLoading(fn, { initialState: false }), {
            initialProps: { fn: initialFunction },
        });

        // Initial render - function should be called
        expect(initialFunction).toHaveBeenCalled();
        expect(result.current).toBe(false);

        // Create a new function that returns true and rerender
        const trueFunction = jest.fn().mockReturnValue(true);
        rerender({ fn: trueFunction });

        // New function should be called and result should immediately be true
        expect(trueFunction).toHaveBeenCalled();
        expect(result.current).toBe(true);

        // Create a function that returns false and rerender
        const falseFunction = jest.fn().mockReturnValue(false);
        rerender({ fn: falseFunction });

        // New function should be called
        expect(falseFunction).toHaveBeenCalled();

        // Should still be loading before the delay
        expect(result.current).toBe(true);

        // Should not be loading after the delay
        act(() => {
            jest.advanceTimersByTime(DEFAULT_DELAY);
        });
        expect(result.current).toBe(false);
    });

    it('should clear timeout when unmounted', () => {
        jest.spyOn(global, 'clearTimeout');

        const { unmount, rerender } = renderHook((props) => useStableLoading(props), {
            initialProps: true,
        });

        // Change to false, which starts the timeout
        rerender(false);

        // Unmount before timeout completes
        unmount();

        // Should have cleared the timeout
        expect(global.clearTimeout).toHaveBeenCalled();
    });

    it('should clear previous timeout when condition changes', () => {
        jest.spyOn(global, 'clearTimeout');

        const { rerender } = renderHook((props) => useStableLoading(props), {
            initialProps: true,
        });

        // Change to false, which starts the timeout
        rerender(false);

        // Change to true before timeout completes
        rerender(true);

        // Should have cleared the timeout
        expect(global.clearTimeout).toHaveBeenCalled();
    });
});
