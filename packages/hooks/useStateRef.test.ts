import { act, renderHook } from '@testing-library/react-hooks';

import { useStateRef } from '@proton/hooks';

describe('useStateRef', () => {
    it('should update ref when state is updated', () => {
        const hook = renderHook(() => useStateRef(0));

        act(() => {
            const [, dispatch] = hook.result.current;
            dispatch(1);
        });

        const [state, , ref] = hook.result.current;

        expect(state).toEqual(1);
        expect(ref.current).toEqual(1);
    });

    it('should update ref when state is updated with function', () => {
        const hook = renderHook(() => useStateRef(0));

        act(() => {
            const [, dispatch] = hook.result.current;
            dispatch((prev) => prev + 1);
        });

        const [state, , ref] = hook.result.current;

        expect(state).toEqual(1);
        expect(ref.current).toEqual(1);
    });
});
