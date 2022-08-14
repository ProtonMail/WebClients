import { act, renderHook } from '@testing-library/react-hooks';

import useControlled from './useControlled';

describe('useControlled()', () => {
    it('initializes with its passed value', () => {
        const initial = 0;

        const hook = renderHook(() => useControlled(initial));

        const [state] = hook.result.current;

        expect(state).toBe(initial);
    });

    it('ignores setState if a value from the outside is passed into it', () => {
        const initial = 0;

        const hook = renderHook(() => useControlled(initial));

        act(() => {
            const [, setState] = hook.result.current;

            setState(1);
        });

        const [state] = hook.result.current;

        expect(state).toBe(initial);
    });

    it('behaves like useState if no value is passed to it', () => {
        const initial = undefined as undefined | number;

        const hook = renderHook(() => useControlled(initial, 0));

        const [stateOne] = hook.result.current;

        expect(stateOne).toBe(0);

        act(() => {
            const [, setState] = hook.result.current;

            setState(1);
        });

        const [stateTwo] = hook.result.current;

        expect(stateTwo).toBe(1);
    });

    it('propagates values passed from the outside when they update', () => {
        const hook = renderHook(({ initial }) => useControlled(initial), { initialProps: { initial: 0 } });

        hook.rerender({ initial: 1 });

        const [state] = hook.result.current;

        expect(state).toBe(1);
    });

    it('switches from uncontrolled to controlled if initially no value is passed but later is', () => {
        const hook = renderHook(({ initial }) => useControlled(initial), {
            initialProps: { initial: undefined as undefined | number },
        });

        act(() => {
            const [, setState] = hook.result.current;

            setState(1);
        });

        hook.rerender({ initial: 2 });

        const [stateTwo] = hook.result.current;

        expect(stateTwo).toBe(2);

        act(() => {
            const [, setState] = hook.result.current;

            setState(3);
        });

        const [stateThree] = hook.result.current;

        expect(stateThree).toBe(2);
    });
});
