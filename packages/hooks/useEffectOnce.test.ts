import { renderHook } from '@testing-library/react-hooks';

import useEffectOnce from './useEffectOnce';

describe('useEffect()', () => {
    it('initiates with the value returned from its callback argument', () => {
        const fn = jest.fn();
        const { rerender } = renderHook(() => useEffectOnce(fn));
        rerender();
        expect(fn).toHaveBeenCalledTimes(1);
    });

    it('only calls once between renders', () => {
        const fn = jest.fn();
        const { rerender } = renderHook<{ a: string }, void>(({ a = '' }) => useEffectOnce(fn, [a]));
        rerender({ a: 'b' });
        expect(fn).toHaveBeenCalledTimes(1);
        rerender({ a: 'c' });
        expect(fn).toHaveBeenCalledTimes(1);
    });
});
