import { act, renderHook } from '@testing-library/react-hooks';

import useSynchronizingState from './useSynchronizingState';

describe('useSynchronizingState()', () => {
    it('initiates with the value passed to it', () => {
        const hook = renderHook(() => useSynchronizingState('initial'));

        const [value] = hook.result.current;

        expect(value).toBe('initial');
    });

    it('sets the state just as useState would', () => {
        const initial = 0;

        const hook = renderHook(() => useSynchronizingState(initial));

        act(() => {
            const [, setState] = hook.result.current;

            setState(1);
        });

        const [value] = hook.result.current;

        expect(value).toBe(1);
    });

    it('synchronizes with the value passed to it on updates', () => {
        const hook = renderHook(({ initial }) => useSynchronizingState(initial), { initialProps: { initial: 0 } });

        hook.rerender({ initial: 1 });

        const [value] = hook.result.current;

        expect(value).toBe(1);
    });
});
