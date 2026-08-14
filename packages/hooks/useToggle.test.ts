import { act, renderHook } from '@testing-library/react-hooks';

import useToggle from './useToggle';

describe('useToggle()', () => {
    it('defaults to false', () => {
        const hook = renderHook(() => useToggle());

        expect(hook.result.current.state).toBe(false);
    });

    it('initializes with its passed value', () => {
        const hook = renderHook(() => useToggle(true));

        expect(hook.result.current.state).toBe(true);
    });

    it('flips the state when toggled', () => {
        const hook = renderHook(() => useToggle());

        act(() => {
            hook.result.current.toggle();
        });

        expect(hook.result.current.state).toBe(true);

        act(() => {
            hook.result.current.toggle();
        });

        expect(hook.result.current.state).toBe(false);
    });

    it('sets the state to an explicit value', () => {
        const hook = renderHook(() => useToggle());

        act(() => {
            hook.result.current.set(true);
        });

        expect(hook.result.current.state).toBe(true);
    });

    it('follows the forced state when it changes from the outside', () => {
        const hook = renderHook(({ forcedState }) => useToggle(forcedState), {
            initialProps: { forcedState: false },
        });

        hook.rerender({ forcedState: true });

        expect(hook.result.current.state).toBe(true);
    });
});
