import { MAX_RETRIES_BEFORE_FAIL } from '../constants';
import { UploadingBlock } from './interface';
import { createUploadingBlock } from './testHelpers';
import startUploadJobs from './upload';
import { Pauser } from './pauser';

describe('upload jobs', () => {
    const mockProgressCallback = jest.fn();

    let pauser: Pauser;

    beforeEach(() => {
        mockProgressCallback.mockClear();

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
        await startUploadJobs(pauser, generator(), mockProgressCallback, mockUploadBlockCallback);

        expect(mockUploadBlockCallback.mock.calls.length).toBe(blocksCount);
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
        });
        // @ts-ignore
        await startUploadJobs(pauser, generator(), mockProgressCallback, mockUploadBlockCallback);
        expect(pauser.isPaused).toBe(false);
        expect(mockUploadBlockCallback.mock.calls.length).toBe(2); // First call and after resume.
        // @ts-ignore
        expect(mockUploadBlockCallback.mock.calls.map((call) => call[0])).toMatchObject(['link1', 'link1']);
    });

    it('retries the same block number times before giving up when network error happens', async () => {
        async function* generator(): AsyncGenerator<UploadingBlock> {
            yield createUploadingBlock(1);
        }

        const err = new Error('Network error');
        const mockUploadBlockCallback = jest.fn(() => {
            throw err;
        });
        const promise = startUploadJobs(pauser, generator(), mockProgressCallback, mockUploadBlockCallback);
        await expect(promise).rejects.toBe(err);
        expect(mockUploadBlockCallback.mock.calls.length).toBe(1 + MAX_RETRIES_BEFORE_FAIL); // First call + retries.
    });
});
