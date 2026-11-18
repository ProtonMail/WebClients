import { renderHook } from '@testing-library/react';

import useEffectOnce from './useEffectOnce';

describe('useEffect()', () => {
    it('initiates with the value returned from its callback argument', () => {
        const fn = vi.fn();
        const { rerender } = renderHook(() => useEffectOnce(fn));
        rerender();
        expect(fn).toHaveBeenCalledTimes(1);
    });

    it('only calls once between renders', () => {
        const fn = vi.fn();
        const { rerender } = renderHook(({ a }) => useEffectOnce(fn, [a]), { initialProps: { a: '' } });
        rerender({ a: 'b' });
        expect(fn).toHaveBeenCalledTimes(1);
        rerender({ a: 'c' });
        expect(fn).toHaveBeenCalledTimes(1);
    });
});
