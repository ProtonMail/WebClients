import type { Api } from '@proton/pass/types';
import { ApiError } from '@proton/shared/lib/fetch/ApiError';

import * as cache from './cache';
import { createAbortResponse, createNetworkError } from './fetch-controller';
import { createImageProxyHandler } from './images';

const { withMaxAgeHeaders } = cache;

describe('createImageProxyHandler', () => {
    const mockUrl = '/test/image';
    const mockApi = jest.fn();
    const mockCache = { match: jest.fn(), put: jest.fn().mockImplementation(() => Promise.resolve()) };
    const imageProxy = createImageProxyHandler(mockApi as unknown as Api);
    const apiParams = { url: mockUrl, output: 'raw', sideEffects: false };

    beforeEach(() => {
        jest.spyOn(cache, 'getCache').mockImplementation(() => Promise.resolve(mockCache as unknown as Cache));
        mockApi.mockClear();
        mockCache.match.mockClear();
        mockCache.put.mockClear();
    });

    it('should return cached response if available and not expired', async () => {
        const response = new Response('cached', { headers: withMaxAgeHeaders(new Response(), 100) });
        mockCache.match.mockResolvedValue(response);

        const result = await imageProxy(mockUrl);
        await expect(result).toMatchResponse(response);
        expect(mockApi).not.toHaveBeenCalled();
    });

    it('should fetch from network if cache is empty', async () => {
        const response = new Response('from_network', { status: 200 });
        mockApi.mockResolvedValue(response);
        mockCache.match.mockResolvedValue(undefined);

        const result = await imageProxy(mockUrl);
        const [url, cached] = mockCache.put.mock.lastCall!;

        expect(mockApi).toHaveBeenCalledWith(expect.objectContaining(apiParams));
        expect(mockCache.put).toHaveBeenCalled();
        expect(result.status).toBe(200);
        expect(url).toEqual(mockUrl);
        await expect(cached).toMatchResponse(result);
    });

    it('should handle AbortError', async () => {
        mockCache.match.mockResolvedValue(undefined);
        mockApi.mockRejectedValue({ name: 'AbortError' });

        const result = await imageProxy(mockUrl);

        expect(mockApi).toHaveBeenCalledWith(expect.objectContaining(apiParams));
        expect(mockCache.put).not.toHaveBeenCalled();
        await expect(result).toMatchResponse(createAbortResponse());
    });

    it('should handle ApiError with 422 status', async () => {
        mockCache.match.mockResolvedValue(undefined);
        mockApi.mockRejectedValue(new ApiError('Unprocessable Content', 422, 'StatusCodeError'));

        const result = await imageProxy(mockUrl);
        const [url, cached] = mockCache.put.mock.lastCall!;

        expect(mockApi).toHaveBeenCalledWith(expect.objectContaining(apiParams));
        expect(result.status).toEqual(422);
        expect(result.headers.get('Cache-Control')).toBeDefined();
        expect(url).toEqual(mockUrl);
        await expect(cached).toMatchResponse(result);
    });

    it('should handle network error', async () => {
        mockCache.match.mockResolvedValue(undefined);
        mockApi.mockRejectedValue(new Error('Network error'));

        const result = await imageProxy(mockUrl);

        expect(mockApi).toHaveBeenCalledWith(expect.objectContaining(apiParams));
        expect(mockCache.put).not.toHaveBeenCalled();
        await expect(result).toMatchResponse(createNetworkError(408));
    });

    it('should return cached response while revalidating', async () => {
        const staleHeaders = new Headers();
        staleHeaders.set('Date', 'Fri, 14 Dec 1990 09:39:46 GMT');
        staleHeaders.set('Cache-Control', `max-age=0`);

        const cachedResponse = new Response('cached', { headers: staleHeaders });
        const response = new Response('from_network', { status: 200 });

        mockCache.match.mockResolvedValue(cachedResponse);
        mockApi.mockResolvedValue(response);

        const result = await imageProxy(mockUrl);
        await new Promise(process.nextTick); // let cache side-effect happen
        const [url, cached] = mockCache.put.mock.lastCall!;

        expect(mockApi).toHaveBeenCalledWith(expect.objectContaining(apiParams));
        expect(url).toEqual(mockUrl);
        expect(mockCache.put).toHaveBeenCalled();
        expect(cached.status).toEqual(200);
        expect(cached.headers.get('Cache-Control')).toBeDefined();
        await expect(result).toMatchResponse(cachedResponse);
    });
});
