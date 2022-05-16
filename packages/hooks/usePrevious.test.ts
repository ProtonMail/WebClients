import { renderHook } from '@testing-library/react-hooks';

import usePrevious from './usePrevious';

describe('usePrevious()', () => {
    it('remembers the value passed to it in the previous render cycle', () => {
        const hook = renderHook(({ initial }) => usePrevious(initial), { initialProps: { initial: 0 } });

        hook.rerender({ initial: 1 });

        const previous = hook.result.current;

        expect(previous).toBe(0);
    });
});
