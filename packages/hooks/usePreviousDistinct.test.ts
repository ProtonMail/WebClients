import { renderHook } from '@testing-library/react-hooks';

import usePreviousDistinct from './usePreviousDistinct';

describe('usePreviousDistinct()', () => {
    it('returns undefined on first render', () => {
        const hook = renderHook(({ value }) => usePreviousDistinct(value), { initialProps: { value: 0 } });

        expect(hook.result.current).toBeUndefined();
    });

    it('remembers the previous distinct value when the value changes', () => {
        const hook = renderHook(({ value }) => usePreviousDistinct(value), { initialProps: { value: 0 } });

        hook.rerender({ value: 1 });

        expect(hook.result.current).toBe(0);
    });

    it('does not update when the value remains the same', () => {
        const hook = renderHook(({ value }) => usePreviousDistinct(value), { initialProps: { value: 0 } });

        hook.rerender({ value: 1 });
        const previousAfterFirstChange = hook.result.current;

        hook.rerender({ value: 1 });
        const previousAfterSameValue = hook.result.current;

        expect(previousAfterFirstChange).toBe(0);
        expect(previousAfterSameValue).toBe(0);
    });
});
