import type { ProtonDriveHTTPClientBlobRequest, ProtonDriveHTTPClientJsonRequest } from '@protontech/drive-sdk';

import { useHttpClient } from './useHttpClient';

const mockApiRequest = jest.fn();
const mockCallWithTimeout = jest.fn(<T>(promise: Promise<T>) => promise);
const mockIncrement = jest.fn();
jest.mock('react', () => ({
    __esModule: true,
    useRef: jest.fn((value) => ({ current: value })),
}));

jest.mock('@proton/app-context/useApi', () => ({
    __esModule: true,
    useApi: () => mockApiRequest,
}));

jest.mock('@proton/metrics', () => ({
    __esModule: true,
    default: {
        drive_warnings_total: {
            increment: (...args: unknown[]) => mockIncrement(...args),
        },
    },
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

    it('records a rate-limited metric and rebuilds the response when a JSON request gets a 429', async () => {
        const statusCodeError = new Error('Too Many Requests');
        statusCodeError.name = 'StatusCodeError';
        Object.assign(statusCodeError, { status: 429, data: { Code: 429, Error: 'Too many requests' } });
        mockApiRequest.mockRejectedValue(statusCodeError);

        const httpClient = useHttpClient();
        const request: ProtonDriveHTTPClientJsonRequest = {
            url: 'https://drive-api.proton.me/api/files',
            method: 'GET',
            headers: new Headers(),
            timeoutMs: 10_000,
        };

        const result = await httpClient.fetchJson(request);

        expect(result.status).toBe(429);
        expect(await result.json()).toEqual({ Code: 429, Error: 'Too many requests' });
        expect(mockIncrement).toHaveBeenCalledWith({ warning: 'http_client_rate_limited' });
    });
});
