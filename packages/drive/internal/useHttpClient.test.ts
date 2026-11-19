import type { ProtonDriveHTTPClientBlobRequest, ProtonDriveHTTPClientJsonRequest } from '@protontech/drive-sdk';

import { useHttpClient } from './useHttpClient';
import { withTimeout } from './withTimeout';

const mockApiRequest = vi.fn();
const mockCallWithTimeout = vi.fn(<T>(promise: Promise<T>) => promise);
const mockIncrement = vi.fn();
vi.mock('react', () => ({
    __esModule: true,
    useRef: vi.fn((value) => ({ current: value })),
}));

vi.mock('@proton/app-context/useApi', () => ({
    __esModule: true,
    useApi: () => mockApiRequest,
}));

vi.mock('@proton/metrics/metricsInstance', () => ({
    __esModule: true,
    default: {
        drive_warnings_total: {
            increment: (...args: unknown[]) => mockIncrement(...args),
        },
    },
}));

vi.mock('./withTimeout', () => ({
    __esModule: true,
    withTimeout: vi.fn(() => ({
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
        vi.clearAllMocks();
    });

    it('returns the raw fetch response when a GET request succeeds', async () => {
        const httpClient = useHttpClient();
        const mockResponse = new Response('ok', { status: 200 });
        const fetchMock = vi.fn().mockResolvedValue(mockResponse);
        global.fetch = fetchMock as typeof global.fetch;

        const stubRequest = vi.fn().mockImplementation(function (url: string, init: RequestInit) {
            return { ...init, url };
        });
        global.Request = stubRequest as typeof global.Request;

        const request: ProtonDriveHTTPClientBlobRequest = {
            url: 'https://drive-api.proton.me/api/files',
            method: 'GET',
            headers: new Headers([['x-custom', 'value']]),
            timeoutMs: 10_000,
        };

        const result = await httpClient.fetchBlob(request);

        expect(result).toBe(mockResponse);
        expect(withTimeout).toHaveBeenCalledWith(request.timeoutMs, undefined);
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
