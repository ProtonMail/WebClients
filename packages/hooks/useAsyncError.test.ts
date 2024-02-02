import { act, renderHook } from '@testing-library/react-hooks';

import useAsyncError from './useAsyncError';

describe('useAsyncError', () => {
    it('should return a function', () => {
        const { result } = renderHook(() => useAsyncError());
        expect(typeof result.current).toBe('function');
    });

    it('should throw an error when called', async () => {
        const { result, waitForNextUpdate } = renderHook(() => useAsyncError());
        const throwError = result.current;

        act(() => {
            throwError(new Error('Test error'));
        });

        await expect(async () => {
            await waitForNextUpdate();
        }).rejects.toThrow();
    });
});
