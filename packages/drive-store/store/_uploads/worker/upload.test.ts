import { MAX_RETRIES_BEFORE_FAIL } from '../constants';
import { UploadingBlockControl } from './interface';
import { Pauser } from './pauser';
import { createUploadingBlockControl } from './testHelpers';
import startUploadJobs, { XHRError } from './upload';

describe('upload jobs', () => {
    const mockUploadBlockFinishCallback = jest.fn();
    const mockUploadBlockExpiredCallback = jest.fn();
    const mockProgressCallback = jest.fn();
    const mockNetworkErrorCallback = jest.fn();
    const mockLogCallback = jest.fn();

    let pauser: Pauser;

    beforeAll(() => {
        jest.spyOn(global.console, 'warn').mockReturnValue();
    });

    beforeEach(() => {
        jest.clearAllMocks();

        pauser = new Pauser();
    });

    it('calls upload for each block', async () => {
        const blocksCount = 10;
        const expectedLinks: string[] = [];
        async function* generator(): AsyncGenerator<UploadingBlockControl> {
            for (let idx = 0; idx < blocksCount; idx++) {
                const block = createUploadingBlockControl(
                    idx,
                    mockUploadBlockFinishCallback,
                    mockUploadBlockExpiredCallback
                );
                expectedLinks.push(block.uploadLink);
                yield block;
            }
        }

        const mockUploadBlockCallback = jest.fn();
        await startUploadJobs(
            pauser,
            generator(),
            mockProgressCallback,
            mockNetworkErrorCallback,
            mockLogCallback,
            mockUploadBlockCallback
        );

        expect(mockUploadBlockCallback).toBeCalledTimes(blocksCount);
        expect(mockUploadBlockCallback.mock.calls.map((call) => call[0])).toMatchObject(expectedLinks);
        expect(mockUploadBlockFinishCallback).toBeCalledTimes(blocksCount);
        expect(mockUploadBlockExpiredCallback).not.toBeCalled();
    });

    it('retries the same block when paused', async () => {
        async function* generator(): AsyncGenerator<UploadingBlockControl> {
            yield createUploadingBlockControl(1, mockUploadBlockFinishCallback, mockUploadBlockExpiredCallback);
        }

        const mockUploadBlockCallback = jest.fn(() => {
            if (mockUploadBlockCallback.mock.calls.length === 1) {
                pauser.pause();
                setTimeout(() => pauser.resume(), 500);
                throw new Error('Upload aborted');
            }
            return Promise.resolve();
        });
        await startUploadJobs(
            pauser,
            generator(),
            mockProgressCallback,
            mockNetworkErrorCallback,
            mockLogCallback,
            mockUploadBlockCallback
        );
        expect(pauser.isPaused).toBe(false);
        expect(mockUploadBlockCallback).toBeCalledTimes(2); // First call and after resume.
        // @ts-ignore
        expect(mockUploadBlockCallback.mock.calls.map((call) => call[0])).toMatchObject(['link1', 'link1']);
        expect(mockUploadBlockFinishCallback).toBeCalledTimes(1); // Only one generated block.
        expect(mockUploadBlockExpiredCallback).not.toBeCalled();
    });

    it('retries the same block number times before giving up when error happens', async () => {
        async function* generator(): AsyncGenerator<UploadingBlockControl> {
            yield createUploadingBlockControl(1, mockUploadBlockFinishCallback, mockUploadBlockExpiredCallback);
        }

        const err = new Error('Some not-network error');
        const mockUploadBlockCallback = jest.fn(() => {
            throw err;
        });
        const promise = startUploadJobs(
            pauser,
            generator(),
            mockProgressCallback,
            mockNetworkErrorCallback,
            mockLogCallback,
            mockUploadBlockCallback
        );
        await expect(promise).rejects.toBe(err);
        expect(mockUploadBlockCallback).toBeCalledTimes(1 + MAX_RETRIES_BEFORE_FAIL); // First call + retries.
        expect(mockUploadBlockFinishCallback).not.toBeCalled();
        expect(mockUploadBlockExpiredCallback).not.toBeCalled();
    });

    it('automatically retries after network error once', async () => {
        async function* generator(): AsyncGenerator<UploadingBlockControl> {
            yield createUploadingBlockControl(1, mockUploadBlockFinishCallback, mockUploadBlockExpiredCallback);
        }

        const mockUploadBlockCallback = jest.fn(() => {
            if (mockUploadBlockCallback.mock.calls.length === 1) {
                throw new Error('network error');
            }
            return Promise.resolve();
        });
        mockNetworkErrorCallback.mockImplementation(() => {
            expect(pauser.isPaused).toBeTruthy();
        });
        await startUploadJobs(
            pauser,
            generator(),
            mockProgressCallback,
            mockNetworkErrorCallback,
            mockLogCallback,
            mockUploadBlockCallback
        );
        // First call + automatic retry.
        expect(mockUploadBlockCallback).toBeCalledTimes(2);
        expect(mockNetworkErrorCallback).toBeCalledTimes(0);
        expect(mockUploadBlockFinishCallback).toBeCalledTimes(1); // Only one generated block.
        expect(mockUploadBlockExpiredCallback).not.toBeCalled();
    });

    it('pauses and notifies about network error', async () => {
        async function* generator(): AsyncGenerator<UploadingBlockControl> {
            yield createUploadingBlockControl(1, mockUploadBlockFinishCallback, mockUploadBlockExpiredCallback);
        }

        const mockUploadBlockCallback = jest.fn(() => {
            // Fail twice as it automatically retries after first failure.
            if (mockUploadBlockCallback.mock.calls.length <= 2) {
                throw new Error('network error');
            }
            return Promise.resolve();
        });
        mockNetworkErrorCallback.mockImplementation(() => {
            expect(pauser.isPaused).toBeTruthy();
            pauser.resume();
        });
        await startUploadJobs(
            pauser,
            generator(),
            mockProgressCallback,
            mockNetworkErrorCallback,
            mockLogCallback,
            mockUploadBlockCallback
        );
        // First call + automatic retry + after resume.
        expect(mockUploadBlockCallback).toBeCalledTimes(3);
        expect(mockNetworkErrorCallback).toBeCalledTimes(1);
        expect(mockNetworkErrorCallback).toHaveBeenCalledWith(new Error('network error'));
        expect(mockUploadBlockFinishCallback).toBeCalledTimes(1); // Only one generated block.
        expect(mockUploadBlockExpiredCallback).not.toBeCalled();
    });

    it('calls retry when token expires', async () => {
        async function* generator(): AsyncGenerator<UploadingBlockControl> {
            yield createUploadingBlockControl(1, mockUploadBlockFinishCallback, mockUploadBlockExpiredCallback);
        }

        const err = new XHRError('Token expired', 2501, 404);
        const mockUploadBlockCallback = jest.fn(() => {
            throw err;
        });
        await startUploadJobs(
            pauser,
            generator(),
            mockProgressCallback,
            mockNetworkErrorCallback,
            mockLogCallback,
            mockUploadBlockCallback
        );
        expect(mockUploadBlockCallback).toBeCalledTimes(1);
        expect(mockUploadBlockFinishCallback).not.toBeCalled();
        expect(mockUploadBlockExpiredCallback).toBeCalledTimes(1);
    });

    it('waits specified time when rate limited', async () => {
        async function* generator(): AsyncGenerator<UploadingBlockControl> {
            yield createUploadingBlockControl(1, mockUploadBlockFinishCallback, mockUploadBlockExpiredCallback);
        }

        const err = new XHRError('Too many requests', 0, 429, {
            headers: new Headers({ 'retry-after': '1' }),
        } as Response);
        const mockUploadBlockCallback = jest.fn(() => {
            // Fail only once.
            if (mockUploadBlockCallback.mock.calls.length === 1) {
                throw err;
            }
            return Promise.resolve();
        });
        await startUploadJobs(
            pauser,
            generator(),
            mockProgressCallback,
            mockNetworkErrorCallback,
            mockLogCallback,
            mockUploadBlockCallback
        );
        expect(mockUploadBlockCallback).toBeCalledTimes(2);
        expect(mockUploadBlockFinishCallback).toBeCalled();
        expect(mockUploadBlockExpiredCallback).not.toBeCalled();
    });
});
