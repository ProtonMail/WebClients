import { act, renderHook } from '@testing-library/react-hooks';

import { useMultiCheckGroups } from './useMultiCheckGroups';

describe('useMultiCheckGroups', () => {
    beforeEach(() => {
        jest.useRealTimers();
    });

    it('should initialize with no loading groups', () => {
        const { result } = renderHook(() => useMultiCheckGroups());

        expect(result.current.getLoadingGroups()).toEqual([]);
        expect(result.current.isGroupLoading('any-group')).toBe(false);
    });

    it('should mark a group as loading when a promise is added', () => {
        const { result } = renderHook(() => useMultiCheckGroups());

        // Create a promise that won't resolve immediately
        const promise = new Promise((resolve) => {
            setTimeout(() => resolve('done'), 100);
        });

        act(() => {
            result.current.addPromiseToGroup('test-group', promise);
        });

        expect(result.current.isGroupLoading('test-group')).toBe(true);
        expect(result.current.getLoadingGroups()).toContain('test-group');
    });

    it('should mark a group as not loading when all promises resolve', async () => {
        const { result, waitForNextUpdate } = renderHook(() => useMultiCheckGroups());

        // Create a promise that resolves quickly
        const promise = Promise.resolve('done');

        act(() => {
            result.current.addPromiseToGroup('test-group', promise);
        });

        // Wait for the promise to resolve and the hook to update
        await waitForNextUpdate();

        expect(result.current.isGroupLoading('test-group')).toBe(false);
        expect(result.current.getLoadingGroups()).not.toContain('test-group');
    });

    it('should mark a group as not loading when all promises reject', async () => {
        const { result, waitForNextUpdate } = renderHook(() => useMultiCheckGroups());

        // Create a promise that rejects quickly
        const promise = Promise.reject(new Error('test error')).catch(() => {
            // Catch it here to prevent unhandled rejection
        });

        act(() => {
            result.current.addPromiseToGroup('test-group', promise);
        });

        // Wait for the promise to reject and the hook to update
        await waitForNextUpdate();

        expect(result.current.isGroupLoading('test-group')).toBe(false);
        expect(result.current.getLoadingGroups()).not.toContain('test-group');
    });

    it('should handle multiple promises in the same group', async () => {
        const { result } = renderHook(() => useMultiCheckGroups());

        // Setup manual promise resolution control
        let resolve1: (value: any) => void;
        let resolve2: (value: any) => void;

        const promise1 = new Promise<string>((res) => {
            resolve1 = res;
        });

        const promise2 = new Promise<string>((res) => {
            resolve2 = res;
        });

        // Add both promises to the same group
        act(() => {
            result.current.addPromiseToGroup('test-group', promise1);
            result.current.addPromiseToGroup('test-group', promise2);
        });

        // Initially both promises are pending
        expect(result.current.isGroupLoading('test-group')).toBe(true);

        // Resolve the first promise
        await act(async () => {
            resolve1!('done1');
            // Small delay to ensure state updates
            await new Promise((r) => setTimeout(r, 10));
        });

        // Group should still be loading because the second promise is pending
        expect(result.current.isGroupLoading('test-group')).toBe(true);

        // Resolve the second promise
        await act(async () => {
            resolve2!('done2');
            // Small delay to ensure state updates
            await new Promise((r) => setTimeout(r, 10));
        });

        // Now the group should not be loading
        expect(result.current.isGroupLoading('test-group')).toBe(false);
    });

    it('should handle multiple groups independently', async () => {
        const { result, waitForNextUpdate } = renderHook(() => useMultiCheckGroups());

        // Create promises for different groups
        const promise1 = new Promise((resolve) => setTimeout(() => resolve('done1'), 50));
        const promise2 = new Promise((resolve) => setTimeout(() => resolve('done2'), 100));

        act(() => {
            result.current.addPromiseToGroup('group1', promise1);
            result.current.addPromiseToGroup('group2', promise2);
        });

        expect(result.current.isGroupLoading('group1')).toBe(true);
        expect(result.current.isGroupLoading('group2')).toBe(true);
        expect(result.current.getLoadingGroups().sort()).toEqual(['group1', 'group2'].sort());

        // Wait for the first promise to resolve
        await waitForNextUpdate();

        // Group1 should not be loading anymore, but group2 still is
        expect(result.current.isGroupLoading('group1')).toBe(false);
        expect(result.current.isGroupLoading('group2')).toBe(true);
        expect(result.current.getLoadingGroups()).toEqual(['group2']);

        // Wait for the second promise to resolve
        await waitForNextUpdate();

        // Now neither group should be loading
        expect(result.current.isGroupLoading('group1')).toBe(false);
        expect(result.current.isGroupLoading('group2')).toBe(false);
        expect(result.current.getLoadingGroups()).toEqual([]);
    });

    it('should clear a group when requested', async () => {
        const { result } = renderHook(() => useMultiCheckGroups());

        // Create a promise that won't resolve immediately
        const promise = new Promise((resolve) => {
            setTimeout(() => resolve('done'), 1000);
        });

        act(() => {
            result.current.addPromiseToGroup('test-group', promise);
        });

        expect(result.current.isGroupLoading('test-group')).toBe(true);

        // Clear the group
        act(() => {
            result.current.clearGroup('test-group');
        });

        // Group should not be loading anymore
        expect(result.current.isGroupLoading('test-group')).toBe(false);
        expect(result.current.getLoadingGroups()).not.toContain('test-group');
    });

    it('should return the original promise for chaining', async () => {
        const { result } = renderHook(() => useMultiCheckGroups());

        // Create a promise with a specific resolution value
        const expectedValue = { success: true };
        const promise = Promise.resolve(expectedValue);

        let actualValue;
        await act(async () => {
            actualValue = await result.current.addPromiseToGroup('test-group', promise);
        });

        expect(actualValue).toEqual(expectedValue);
    });

    it('should propagate promise rejections', async () => {
        const { result } = renderHook(() => useMultiCheckGroups());

        // Create a promise that rejects
        const expectedError = new Error('test error');
        const promise = Promise.reject(expectedError);

        let actualError;
        await act(async () => {
            try {
                await result.current.addPromiseToGroup('test-group', promise);
            } catch (error) {
                actualError = error;
            }
        });

        expect(actualError).toEqual(expectedError);
    });

    // New tests for already settled promises
    it('should not mark group as loading for already fulfilled promise', async () => {
        const { result } = renderHook(() => useMultiCheckGroups());

        // Create a promise that's already fulfilled
        const promise = Promise.resolve('already done');

        await act(async () => {
            await result.current.addPromiseToGroup('test-group', promise);
        });

        // The group should never have been marked as loading
        expect(result.current.isGroupLoading('test-group')).toBe(false);
        expect(result.current.getLoadingGroups()).not.toContain('test-group');
    });

    it('should not mark group as loading for already rejected promise', async () => {
        const { result } = renderHook(() => useMultiCheckGroups());

        // Create a promise that's already rejected
        const rejectedPromise = Promise.reject(new Error('already failed'));

        await act(async () => {
            try {
                await result.current.addPromiseToGroup('test-group', rejectedPromise);
            } catch (error) {
                // Catch the error here to prevent test failure
            }
        });

        // The group should never have been marked as loading
        expect(result.current.isGroupLoading('test-group')).toBe(false);
        expect(result.current.getLoadingGroups()).not.toContain('test-group');
    });

    it('should correctly mix pending and already settled promises', async () => {
        const { result } = renderHook(() => useMultiCheckGroups());

        // Create one pending and one already settled promise
        const pendingPromise = new Promise((resolve) => setTimeout(() => resolve('pending'), 100));
        const settledPromise = Promise.resolve('already done');

        // Add the settled promise first
        await act(async () => {
            await result.current.addPromiseToGroup('test-group', settledPromise);
        });

        // The group should not be loading yet
        expect(result.current.isGroupLoading('test-group')).toBe(false);

        // Now add the pending promise
        act(() => {
            result.current.addPromiseToGroup('test-group', pendingPromise);
        });

        // Now the group should be loading
        expect(result.current.isGroupLoading('test-group')).toBe(true);
        expect(result.current.getLoadingGroups()).toContain('test-group');

        // Wait for the pending promise to resolve
        await act(async () => {
            await pendingPromise;
            // Small delay to ensure state updates
            await new Promise((r) => setTimeout(r, 10));
        });

        // Now the group should not be loading again
        expect(result.current.isGroupLoading('test-group')).toBe(false);
        expect(result.current.getLoadingGroups()).not.toContain('test-group');
    });
});
