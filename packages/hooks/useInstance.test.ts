import { act, renderHook } from '@testing-library/react-hooks';

import useInstance from './useInstance';

describe('useInstance()', () => {
    it('initiates with the value returned from its callback argument', () => {
        const hook = renderHook(() => useInstance(() => 'initial'));

        expect(hook.result.current).toBe('initial');
    });

    it('keeps referential equality of the initial value between render cycles', () => {
        const initial = {};

        const hook = renderHook(() => useInstance(() => initial));

        act(() => {});

        expect(hook.result.current).toBe(initial);
    });

    it('only executes the passed callback once', () => {
        const callback = jest.fn(() => 'initial');

        renderHook(() => useInstance(callback));

        act(() => {});

        expect(callback).toHaveBeenCalledTimes(1);
    });

    it('handles falsy values correctly', () => {
        const hook1 = renderHook(() => useInstance(() => null));
        const hook2 = renderHook(() => useInstance(() => undefined));
        const hook3 = renderHook(() => useInstance(() => 0));
        const hook4 = renderHook(() => useInstance(() => false));
        const hook5 = renderHook(() => useInstance(() => ''));

        expect(hook1.result.current).toBe(null);
        expect(hook2.result.current).toBe(undefined);
        expect(hook3.result.current).toBe(0);
        expect(hook4.result.current).toBe(false);
        expect(hook5.result.current).toBe('');
    });

    it('works with different types of values', () => {
        const objectHook = renderHook(() => useInstance(() => ({ key: 'value' })));
        const arrayHook = renderHook(() => useInstance(() => [1, 2, 3]));
        const functionHook = renderHook(() => useInstance(() => () => 'function result'));
        const numberHook = renderHook(() => useInstance(() => 42));

        expect(objectHook.result.current).toEqual({ key: 'value' });
        expect(arrayHook.result.current).toEqual([1, 2, 3]);
        expect(typeof functionHook.result.current).toBe('function');
        expect(functionHook.result.current()).toBe('function result');
        expect(numberHook.result.current).toBe(42);
    });

    it('maintains referential equality with multiple re-renders', () => {
        const initial = { counter: 0 };
        const hook = renderHook(() => useInstance(() => initial));

        const firstResult = hook.result.current;

        // Force multiple re-renders
        hook.rerender();
        hook.rerender();
        hook.rerender();

        expect(hook.result.current).toBe(firstResult);
        expect(hook.result.current).toBe(initial);
    });

    it('callback is not called again even after re-renders with different callback', () => {
        const callback1 = jest.fn(() => 'value1');
        const callback2 = jest.fn(() => 'value2');

        const hook = renderHook(({ fn }) => useInstance(fn), { initialProps: { fn: callback1 } });

        expect(hook.result.current).toBe('value1');
        expect(callback1).toHaveBeenCalledTimes(1);

        // Re-render with different callback
        hook.rerender({ fn: callback2 });

        // Should still return the original value and not call the new callback
        expect(hook.result.current).toBe('value1');
        expect(callback1).toHaveBeenCalledTimes(1);
        expect(callback2).not.toHaveBeenCalled();
    });
});
