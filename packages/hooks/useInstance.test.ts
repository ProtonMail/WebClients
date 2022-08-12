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
});
