import { MAX_RETRIES_BEFORE_FAIL } from '../constants';
import { UploadingBlock } from './interface';
import { createUploadingBlock } from './testHelpers';
import startUploadJobs from './upload';
import { Pauser } from './pauser';

describe('upload jobs', () => {
    const mockProgressCallback = jest.fn();
    const mockNetworkErrorCallback = jest.fn();

    let pauser: Pauser;

    beforeEach(() => {
        jest.clearAllMocks();

        pauser = new Pauser();
    });

    it('calls upload for each block', async () => {
        const blocksCount = 10;
        const expectedLinks: string[] = [];
        async function* generator(): AsyncGenerator<UploadingBlock> {
            for (let idx = 0; idx < blocksCount; idx++) {
                const block = createUploadingBlock(idx);
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
            mockUploadBlockCallback
        );

        expect(mockUploadBlockCallback).toBeCalledTimes(blocksCount);
        expect(mockUploadBlockCallback.mock.calls.map((call) => call[0])).toMatchObject(expectedLinks);
    });

    it('retries the same block when paused', async () => {
        async function* generator(): AsyncGenerator<UploadingBlock> {
            yield createUploadingBlock(1);
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
            mockUploadBlockCallback
        );
        expect(pauser.isPaused).toBe(false);
        expect(mockUploadBlockCallback).toBeCalledTimes(2); // First call and after resume.
        // @ts-ignore
        expect(mockUploadBlockCallback.mock.calls.map((call) => call[0])).toMatchObject(['link1', 'link1']);
    });

    it('retries the same block number times before giving up when error happens', async () => {
        async function* generator(): AsyncGenerator<UploadingBlock> {
            yield createUploadingBlock(1);
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
            mockUploadBlockCallback
        );
        await expect(promise).rejects.toBe(err);
        expect(mockUploadBlockCallback).toBeCalledTimes(1 + MAX_RETRIES_BEFORE_FAIL); // First call + retries.
    });

    it('pauses and notifies about network error', async () => {
        async function* generator(): AsyncGenerator<UploadingBlock> {
            yield createUploadingBlock(1);
        }

        const mockUploadBlockCallback = jest.fn(() => {
            if (mockUploadBlockCallback.mock.calls.length === 1) {
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
            mockUploadBlockCallback
        );
        expect(mockUploadBlockCallback).toBeCalledTimes(2); // First call + resume.
        expect(mockNetworkErrorCallback).toBeCalledTimes(1);
        expect(mockNetworkErrorCallback).toBeCalledWith('network error');
    });
});
