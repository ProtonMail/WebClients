import type { ProtonDriveHTTPClientBlobRequest } from '@protontech/drive-sdk';

import { useHttpClient } from './useHttpClient';

const mockApiRequest = jest.fn();
const mockCallWithTimeout = jest.fn(<T>(promise: Promise<T>) => promise);
jest.mock('react', () => ({
    __esModule: true,
    useRef: jest.fn((value) => ({ current: value })),
}));

jest.mock('@proton/components/hooks/useApi', () => ({
    __esModule: true,
    default: () => mockApiRequest,
}));

jest.mock('./withTimeout', () => ({
    __esModule: true,
    withTimeout: jest.fn(() => ({
        signalWithTimeout: new AbortController().signal,
        callWithTimeout: mockCallWithTimeout,
    })),
}));

describe('useHttpClient', () => {
    const originalFetch = global.fetch;
    const originalRequest = global.Request;

    afterEach(() => {
        global.fetch = originalFetch;
        global.Request = originalRequest;
        jest.clearAllMocks();
    });

    it('returns the raw fetch response when a GET request succeeds', async () => {
        const httpClient = useHttpClient();
        const mockResponse = new Response('ok', { status: 200 });
        const fetchMock = jest.fn().mockResolvedValue(mockResponse);
        global.fetch = fetchMock as typeof global.fetch;

        const stubRequest = jest.fn().mockImplementation((url: string, init: RequestInit) => ({
            ...init,
            url,
        }));
        global.Request = stubRequest as typeof global.Request;

        const request: ProtonDriveHTTPClientBlobRequest = {
            url: 'https://drive-api.proton.me/api/files',
            method: 'GET',
            headers: new Headers([['x-custom', 'value']]),
            timeoutMs: 10_000,
        };

        const result = await httpClient.fetchBlob(request);

        expect(result).toBe(mockResponse);
        const withTimeoutModule = require('./withTimeout') as { withTimeout: jest.Mock };
        expect(withTimeoutModule.withTimeout).toHaveBeenCalledWith(request.timeoutMs, undefined);
        expect(mockCallWithTimeout).toHaveBeenCalledTimes(1);

        expect(stubRequest).toHaveBeenCalledWith(request.url, {
            method: request.method,
            headers: expect.any(Headers),
            body: request.body,
            signal: expect.anything(),
            credentials: 'omit',
        });
        expect(fetchMock).toHaveBeenCalledTimes(1);
        expect(fetchMock).toHaveBeenCalledWith(expect.objectContaining({ url: request.url }));
    });
});
