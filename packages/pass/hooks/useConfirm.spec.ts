import { act, renderHook } from '@testing-library/react-hooks';

import { useConfirm } from './useConfirm';

describe('useConfirm', () => {
    const action = jest.fn((param: number) => param);
    beforeEach(() => action.mockClear());

    it('should initialize with pending `false` and `null` param', () => {
        const { result } = renderHook(() => useConfirm(action));

        expect(result.current.pending).toBe(false);
        expect(result.current.param).toBeNull();
    });

    it('should set pending to `true` and update param when prompting', () => {
        const { result } = renderHook(() => useConfirm(action));

        act(() => result.current.prompt(42));
        expect(result.current.pending).toBe(true);
        expect(result.current.param).toBe(42);
    });

    it('should reset state when cancelling', () => {
        const { result } = renderHook(() => useConfirm(action));

        act(() => result.current.prompt(42));
        act(() => result.current.cancel());
        expect(result.current.pending).toBe(false);
        expect(result.current.param).toBeNull();
    });

    it('should call the action when confirming', () => {
        const { result } = renderHook(() => useConfirm(action));
        let confirmed;

        act(() => result.current.prompt(42));
        act(() => {
            confirmed = result.current.confirm();
        });

        expect(action).toHaveBeenCalledWith(42);
        expect(confirmed).toBe(42);
        expect(result.current.pending).toBe(false);
        expect(result.current.param).toBeNull();
    });

    it('should not call action when confirming before prompting', () => {
        const { result } = renderHook(() => useConfirm(action));
        let confirmed;

        act(() => {
            confirmed = result.current.confirm();
        });

        expect(action).not.toHaveBeenCalled();
        expect(confirmed).toBeUndefined();
        expect(result.current.pending).toBe(false);
        expect(result.current.param).toBeNull();
    });

    it('should update param when prompted multiple times', () => {
        const { result } = renderHook(() => useConfirm(action));

        act(() => result.current.prompt(42));
        expect(result.current.param).toBe(42);

        act(() => result.current.prompt(1337));
        expect(result.current.param).toBe(1337);
    });
});
