import { importWithRetry, isChunkLoadError } from './importWithRetry';

const networkError = () => new DOMException('The script failed to load.', 'NetworkError');

const chunkLoadError = () => {
    const error = new Error('Loading chunk 42 failed.');
    error.name = 'ChunkLoadError';
    return error;
};

describe('isChunkLoadError', () => {
    it('should accept errors from chunks that failed to load', () => {
        expect(isChunkLoadError(networkError())).toBe(true);
        expect(isChunkLoadError(chunkLoadError())).toBe(true);
    });

    it('should reject other errors and non-errors', () => {
        expect(isChunkLoadError(new Error('boom'))).toBe(false);
        expect(isChunkLoadError(new SyntaxError('bad token'))).toBe(false);
        expect(isChunkLoadError('NetworkError')).toBe(false);
        expect(isChunkLoadError(null)).toBe(false);
        expect(isChunkLoadError(undefined)).toBe(false);
    });
});

describe('importWithRetry', () => {
    it('should return the module when the first load succeeds', async () => {
        const load = jest.fn().mockResolvedValue('module');

        await expect(importWithRetry(load, { delayMs: 0 })).resolves.toBe('module');
        expect(load).toHaveBeenCalledTimes(1);
    });

    it('should retry chunk load failures until the load succeeds', async () => {
        const load = jest
            .fn()
            .mockRejectedValueOnce(networkError())
            .mockRejectedValueOnce(chunkLoadError())
            .mockResolvedValue('module');

        await expect(importWithRetry(load, { delayMs: 0 })).resolves.toBe('module');
        expect(load).toHaveBeenCalledTimes(3);
    });

    it('should retry a load that throws synchronously, like importScripts', async () => {
        const load = jest
            .fn()
            .mockImplementationOnce(() => {
                throw networkError();
            })
            .mockResolvedValue('module');

        await expect(importWithRetry(load, { delayMs: 0 })).resolves.toBe('module');
        expect(load).toHaveBeenCalledTimes(2);
    });

    it('should throw the last error once the retries are used up', async () => {
        const error = networkError();
        const load = jest.fn().mockRejectedValue(error);

        await expect(importWithRetry(load, { retries: 2, delayMs: 0 })).rejects.toBe(error);
        expect(load).toHaveBeenCalledTimes(3);
    });

    it('should not retry errors other than chunk load failures', async () => {
        const error = new Error('Module failed to start');
        const load = jest.fn().mockRejectedValue(error);

        await expect(importWithRetry(load, { delayMs: 0 })).rejects.toBe(error);
        expect(load).toHaveBeenCalledTimes(1);
    });
});
