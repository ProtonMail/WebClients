import noop from '@proton/utils/noop';

import { MAX_ENCRYPTED_BLOCKS, MAX_UPLOADING_BLOCKS, MAX_UPLOAD_JOBS } from '../constants';
import type { EncryptedBlock } from '../interface';
import { ThumbnailType } from '../media';
import UploadWorkerBuffer from './buffer';
import {
    createBlock,
    createLink,
    createThumbnailBlock,
    createThumbnailUploadingBlock,
    createUploadingBlock,
    waitFor,
} from './testHelpers';

function mockGenerator(start: number, end: number) {
    let position = 0;
    async function* generator(): AsyncGenerator<EncryptedBlock> {
        for (let idx = start; idx <= end; idx++) {
            position = idx;
            yield createBlock(idx);
        }
    }
    const waitForPosition = (expectedPosition: number) => {
        return waitFor(() => position === expectedPosition);
    };
    return {
        generator,
        waitForPosition,
    };
}

describe('upload worker buffer', () => {
    const mockRequestBlockCreation = jest.fn();

    let buffer: UploadWorkerBuffer;

    beforeEach(() => {
        mockRequestBlockCreation.mockClear();

        buffer = new UploadWorkerBuffer();
    });

    afterEach(() => {
        // Set everything to simulated finished job to stop all the running promises.
        buffer.requestingBlockLinks = false;
        buffer.encryptionFinished = true;
        buffer.uploadingFinished = true;
        buffer.encryptedBlocks.clear();
        buffer.thumbnailsEncryptedBlocks.clear();
        // To stop wait in generateUploadingBlocks.
        buffer.uploadingBlocks = [createUploadingBlock(1)];
    });

    it('keeps encrypted buffer filled', async () => {
        const expectedKeys = [];
        for (let idx = 0; idx < MAX_ENCRYPTED_BLOCKS; idx++) {
            buffer.encryptedBlocks.set(idx, createBlock(idx));
            expectedKeys.push(idx);
        }

        const { generator, waitForPosition } = mockGenerator(1000, 1002);

        buffer.feedEncryptedBlocks(generator()).catch(noop);
        await waitForPosition(1000);
        buffer.encryptedBlocks.delete(0);
        await waitForPosition(1001);
        buffer.encryptedBlocks.delete(1);
        await waitForPosition(1002);

        expectedKeys.shift();
        expectedKeys.shift();
        expectedKeys.push(1000);
        expectedKeys.push(1001);
        await expect(Array.from(buffer.encryptedBlocks.keys())).toMatchObject(expectedKeys);
        expect(buffer.totalProcessedSize).toEqual(2201);
    });

    it('reads next encrypted block if both encrypted and upload buffer is not full', async () => {
        const expectedKeys = [];
        for (let idx = 0; idx < MAX_ENCRYPTED_BLOCKS - 2; idx++) {
            buffer.encryptedBlocks.set(idx, createBlock(idx));
            expectedKeys.push(idx);
        }
        for (let idx = 0; idx < MAX_UPLOADING_BLOCKS; idx++) {
            buffer.uploadingBlocks.push(createUploadingBlock(idx));
        }

        const { generator, waitForPosition } = mockGenerator(1000, 1005);

        buffer.feedEncryptedBlocks(generator()).catch(noop);
        await waitForPosition(1000);
        buffer.uploadingBlocks.shift();
        await waitForPosition(1002);
        expectedKeys.push(1000);
        expectedKeys.push(1001);
        await expect(Array.from(buffer.encryptedBlocks.keys())).toMatchObject(expectedKeys);
    });

    it('creates block links with the first file block', () => {
        buffer.encryptedBlocks.set(1, createBlock(1));
        buffer.runBlockLinksCreation(mockRequestBlockCreation);

        expect(mockRequestBlockCreation.mock.calls).toMatchObject([[[createBlock(1)], []]]);
    });

    it('creates thumbnails and block links', async () => {
        buffer.thumbnailsEncryptedBlocks.set(0, createThumbnailBlock(0, ThumbnailType.PREVIEW));
        buffer.thumbnailsEncryptedBlocks.set(1, createThumbnailBlock(1, ThumbnailType.HD_PREVIEW));
        buffer.encryptedBlocks.set(1, createBlock(1));
        buffer.encryptedBlocks.set(2, createBlock(2));
        buffer.runBlockLinksCreation(mockRequestBlockCreation);

        expect(mockRequestBlockCreation.mock.calls).toMatchObject([
            [
                [createBlock(1), createBlock(2)],
                [createThumbnailBlock(0, ThumbnailType.PREVIEW), createThumbnailBlock(1, ThumbnailType.HD_PREVIEW)],
            ],
        ]);
    });

    it('creates block links when upload buffer is low', async () => {
        for (let idx = 0; idx < MAX_UPLOAD_JOBS; idx++) {
            buffer.uploadingBlocks.push(createUploadingBlock(idx));
        }
        buffer.runBlockLinksCreation(mockRequestBlockCreation);

        expect(mockRequestBlockCreation.mock.calls.length).toBe(0);
    });

    it('creates block links when encrypted buffer is full', async () => {
        const expectedBlocks = [];
        for (let idx = 1; idx <= MAX_ENCRYPTED_BLOCKS; idx++) {
            buffer.encryptedBlocks.set(idx, createBlock(idx));
            expectedBlocks.push(createBlock(idx));
        }
        for (let idx = 0; idx < MAX_UPLOAD_JOBS; idx++) {
            buffer.uploadingBlocks.push(createUploadingBlock(idx));
        }
        buffer.runBlockLinksCreation(mockRequestBlockCreation);

        expect(mockRequestBlockCreation.mock.calls).toMatchObject([[expectedBlocks, []]]);
    });

    it('moves block from encrypted buffer to uploading buffer once link is created', async () => {
        buffer.thumbnailsEncryptedBlocks.set(0, createThumbnailBlock(0, ThumbnailType.PREVIEW));
        buffer.thumbnailsEncryptedBlocks.set(1, createThumbnailBlock(1, ThumbnailType.HD_PREVIEW));
        buffer.encryptedBlocks.set(1, createBlock(1));
        buffer.encryptedBlocks.set(2, createBlock(2));

        buffer.setAllBlockLinks({ fileLinks: [createLink(1)], thumbnailLinks: [createLink(0)] });

        expect(Array.from(buffer.thumbnailsEncryptedBlocks.keys())).toMatchObject([1]);
        expect(Array.from(buffer.encryptedBlocks.keys())).toMatchObject([2]);
        expect(buffer.uploadingBlocks).toMatchObject([
            createThumbnailUploadingBlock(0, buffer.uploadingBlocks[0].isTokenExpired, ThumbnailType.PREVIEW),
            createUploadingBlock(1, buffer.uploadingBlocks[1].isTokenExpired),
        ]);
    });

    it('stops generating uploading blocks when buffers are emtpy and both encryption and uploading finished', async () => {
        buffer.encryptionFinished = true;
        buffer.uploadingFinished = true;

        const { done } = await buffer.generateUploadingBlocks().next();
        expect(done).toBe(true);
    });

    it('does not stop generating uploading blocks when encrypted blocks are present', async () => {
        buffer.encryptionFinished = true;
        buffer.uploadingFinished = true;
        buffer.encryptedBlocks.set(1, createBlock(1));

        const promise = new Promise((resolve, reject) => {
            setTimeout(() => resolve('OK'), 100);
            buffer
                .generateUploadingBlocks()
                .next()
                .then(() => reject(new Error('Generator continued/finished')))
                .catch((err) => reject(err));
        });
        await expect(promise).resolves.toBe('OK');
    });

    it('finishes uploading block and adds it to the hashes and tokens', async () => {
        const block = createUploadingBlock(1);
        buffer.uploadingBlocks.push(block);

        const {
            value: { finish },
        } = await buffer.generateUploadingBlocks().next();

        expect(buffer.blockHashes).toMatchObject([]);
        finish();
        expect(buffer.blockHashes).toMatchObject([{ index: 1, hash: block.block.hash }]);
    });

    it('retries uploading block by adding it back to encrypted buffer', async () => {
        const block = createUploadingBlock(1);
        buffer.uploadingBlocks.push(block);

        const {
            value: { onTokenExpiration },
        } = await buffer.generateUploadingBlocks().next();

        expect(buffer.encryptedBlocks).toMatchObject(new Map());
        onTokenExpiration();
        expect(buffer.encryptedBlocks).toMatchObject(new Map([[1, block.block]]));
        expect(buffer.blockHashes).toMatchObject([]);
    });

    it('waits for blocks to be processed', async () => {
        buffer.encryptionFinished = true;
        buffer.uploadingBlocks.push(createUploadingBlock(1));

        const generator = buffer.generateUploadingBlocks();
        const {
            value: { finish },
        } = await generator.next();

        // Ask for next item to make the generator run the check if all blocks
        // are finished. It should not be finished until all blocks are done
        // and finish callback for each of them was called.
        const finishedGenerator = generator.next();
        expect(buffer.uploadingFinished).toBeFalsy();

        finish();

        // Await just to be sure it was finished. If there is nothing in the
        // queue, it runs a loop until anything appears in the queue or all
        // blocks are completed (finish was called).
        await finishedGenerator;
        expect(buffer.uploadingFinished).toBeTruthy();
    });

    it('gets hash in proper order', () => {
        buffer.blockHashes = [3, 2, 4, 1].map((index) => ({ index, hash: new Uint8Array([index]) }));
        expect(buffer.hash).toMatchObject(new Uint8Array([1, 2, 3, 4]));
    });
});
