import { noop } from '@proton/shared/lib/helpers/function';

import { EncryptedBlock, EncryptedThumbnailBlock } from '../interface';
import UploadWorkerBuffer from './buffer';
import { MAX_ENCRYPTED_BLOCKS, MAX_UPLOADING_BLOCKS, MAX_UPLOAD_JOBS } from '../constants';
import { waitFor, createBlock, createUploadingBlock, createLink } from './testHelpers';

function mockGenerator(start: number, end: number) {
    let position = 0;
    async function* generator(): AsyncGenerator<EncryptedBlock | EncryptedThumbnailBlock> {
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
        buffer.encryptedBlocks.clear();
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

        buffer.feedEncryptedBlocks(generator()).finally(noop);
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

        buffer.feedEncryptedBlocks(generator()).finally(noop);
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

        expect(mockRequestBlockCreation.mock.calls).toMatchObject([[[createBlock(1)], undefined]]);
    });

    it('does not create block link with thumbnail block only', async () => {
        buffer.encryptedBlocks.set(0, createBlock(0)); // Thumbnail has index = 0.
        buffer.runBlockLinksCreation(mockRequestBlockCreation);

        expect(mockRequestBlockCreation.mock.calls.length).toBe(0);
    });

    it('creates thumbnail and block links', async () => {
        buffer.encryptedBlocks.set(0, createBlock(0)); // Thumbnail has index = 0.
        buffer.encryptedBlocks.set(1, createBlock(1));
        buffer.encryptedBlocks.set(2, createBlock(2));
        buffer.runBlockLinksCreation(mockRequestBlockCreation);

        expect(mockRequestBlockCreation.mock.calls).toMatchObject([[[createBlock(1), createBlock(2)], createBlock(0)]]);
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

        expect(mockRequestBlockCreation.mock.calls).toMatchObject([[expectedBlocks, undefined]]);
    });

    it('moves block from encrypted buffer to uploading buffer once link is created', async () => {
        buffer.encryptedBlocks.set(0, createBlock(0)); // Thumbnail has index = 0.
        buffer.encryptedBlocks.set(1, createBlock(1));
        buffer.encryptedBlocks.set(2, createBlock(2));

        buffer.setBlockLinks([createLink(0), createLink(1)]);

        expect(Array.from(buffer.encryptedBlocks.keys())).toMatchObject([2]);
        expect(buffer.uploadingBlocks).toMatchObject([createUploadingBlock(0), createUploadingBlock(1)]);
    });

    it('stops generating uploading blocks when buffers are emtpy and encryption finished', async () => {
        buffer.encryptionFinished = true;

        const { done } = await buffer.generateUploadingBlocks().next();
        expect(done).toBe(true);
    });

    it('does not stop generating uploading blocks when encrypted blocks are present', async () => {
        buffer.encryptionFinished = true;
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
});
