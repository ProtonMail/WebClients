/* eslint-disable react/display-name */
import React from 'react';
import { renderHook } from '@testing-library/react-hooks';
import { useApi, CacheProvider } from '@proton/components';
import createCache from '@proton/shared/lib/helpers/cache';
import { Api } from '@proton/shared/lib/interfaces';
import useDebouncedRequest from './useDebouncedRequest';

jest.mock('@proton/components/hooks/useApi');

const mockUseApi = useApi as jest.MockedFunction<typeof useApi>;

describe('useDebouncedRequest', () => {
    let debouncedRequest: Api;
    const mockApi = jest.fn().mockImplementation((query: object) => Promise.resolve(query));
    mockUseApi.mockReturnValue(mockApi);

    beforeEach(() => {
        const cache = createCache();
        const { result } = renderHook(() => useDebouncedRequest(), {
            wrapper: ({ children }: { children?: React.ReactNode }) => (
                <CacheProvider cache={cache}>{children}</CacheProvider>
            ),
        });
        debouncedRequest = result.current;
        mockApi.mockClear();
    });

    it('should initially call debounced function instantly', async () => {
        await debouncedRequest({ test: 'test' });

        expect(mockApi).toHaveBeenCalledTimes(1);
    });

    it('should return initial call result if called while pending', async () => {
        const firstCall = debouncedRequest({ test: 'test' });
        const secondCall = debouncedRequest({ test: 'test' });
        const firstCallResult = await firstCall;
        const secondCallResult = await secondCall;

        expect(mockApi).toHaveBeenCalledTimes(1);
        expect(secondCallResult).toBe(firstCallResult);
    });

    it('should return new call result if called after initial call is completed', async () => {
        const firstCall = debouncedRequest({ test: 'test' });
        const firstCallResult = await firstCall;
        const secondCall = debouncedRequest({ test: 'test' });
        const secondCallResult = await secondCall;

        expect(mockApi).toHaveBeenCalledTimes(2);
        expect(secondCallResult).not.toBe(firstCallResult);
    });
});
