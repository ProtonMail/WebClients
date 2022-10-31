import * as React from 'react';

import { renderHook } from '@testing-library/react-hooks';

import { CacheProvider } from '@proton/components';
import createCache from '@proton/shared/lib/helpers/cache';

import useDebouncedFunction from './useDebouncedFunction';

describe('useDebouncedFunction', () => {
    let debouncedFunction: ReturnType<typeof useDebouncedFunction>;

    const mockCallback = jest.fn();

    beforeEach(() => {
        jest.resetAllMocks();
        mockCallback.mockImplementation(() => Promise.resolve({ test: 'test' }));

        const cache = createCache();
        const { result } = renderHook(() => useDebouncedFunction(), {
            wrapper: ({ children }: { children?: React.ReactNode }) => (
                <CacheProvider cache={cache}>{children}</CacheProvider>
            ),
        });
        debouncedFunction = result.current;
    });

    it('should initially call debounced function instantly', async () => {
        await debouncedFunction(mockCallback, { test: 'test' });

        expect(mockCallback).toHaveBeenCalledTimes(1);
    });

    it('should return initial call result if called while pending', async () => {
        const call1 = debouncedFunction(mockCallback, { test: 'test' });
        const call2 = debouncedFunction(mockCallback, { test: 'test' });
        const result1 = await call1;
        const result2 = await call2;

        expect(mockCallback).toHaveBeenCalledTimes(1);
        expect(result2).toBe(result1);
    });

    it('should return new call result if called after initial call is completed', async () => {
        const call1 = debouncedFunction(mockCallback, { test: 'test' });
        const result1 = await call1;
        const call2 = debouncedFunction(mockCallback, { test: 'test' });
        const result2 = await call2;

        expect(mockCallback).toHaveBeenCalledTimes(2);
        expect(result2).not.toBe(result1);
    });

    it('should abort only when all signals are aborted', async () => {
        const ac1 = new AbortController();
        const call1 = debouncedFunction(mockCallback, { test: 'test' }, ac1.signal);
        const ac2 = new AbortController();
        const call2 = debouncedFunction(mockCallback, { test: 'test' }, ac2.signal);
        ac1.abort();
        // Wait first for the call not aborted so the request finishes.
        await expect(call2).resolves.toMatchObject({ test: 'test' });
        await expect(call1).rejects.toThrowError('Aborted');
    });

    it('should abort when all signals are aborted', async () => {
        const ac1 = new AbortController();
        const call1 = debouncedFunction(mockCallback, { test: 'test' }, ac1.signal);
        const ac2 = new AbortController();
        const call2 = debouncedFunction(mockCallback, { test: 'test' }, ac2.signal);
        ac1.abort();
        ac2.abort();
        await expect(call1).rejects.toThrowError('Aborted');
        await expect(call2).rejects.toThrowError('Aborted');
    });

    it('should return original error', async () => {
        const mock = jest.fn();
        mock.mockImplementation(async () => Promise.reject(new Error('failed')));

        const ac1 = new AbortController();
        const call1 = debouncedFunction(mock, { test: 'test' }, ac1.signal);
        const ac2 = new AbortController();
        const call2 = debouncedFunction(mock, { test: 'test' }, ac2.signal);
        await expect(call1).rejects.toThrowError('failed');
        await expect(call2).rejects.toThrowError('failed');
    });

    it('should return original error when aborted', async () => {
        const mock = jest.fn();
        mock.mockImplementation(async () => Promise.reject(new Error('failed')));

        const ac1 = new AbortController();
        const call1 = debouncedFunction(mock, { test: 'test' }, ac1.signal);
        ac1.abort();
        await expect(call1).rejects.toThrowError('failed');
    });
});
