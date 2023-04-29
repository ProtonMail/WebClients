import { CryptoProxy } from '@proton/crypto';
import { FILE_CHUNK_SIZE } from '@proton/shared/lib/drive/constants';
import noop from '@proton/utils/noop';

import {
    generatePrivateKey,
    generateSessionKey,
    releaseCryptoProxy,
    setupCryptoProxyForTesting,
} from '../../../utils/test/crypto';
import { asyncGeneratorToArray } from '../../../utils/test/generator';
import generateBlocks from './encryption';

jest.setTimeout(20000);

describe('block generator', () => {
    beforeAll(async () => {
        await setupCryptoProxyForTesting();
    });

    afterAll(async () => {
        await releaseCryptoProxy();
    });

    const setupPromise = async () => {
        const privateKey = await generatePrivateKey();
        const sessionKey = await generateSessionKey();
        return {
            // We don't test crypto, so no need to have properly two keys.
            addressPrivateKey: privateKey,
            privateKey,
            sessionKey,
        };
    };

    // This is obviously not a good or complete mock implementation
    // but should be sufficient for our implementation
    const mockHasher: any = {
        process: noop,
        finish: () => ({ result: new Uint8Array([1, 2, 3, 4]) }),
    };

    it('should generate all file blocks', async () => {
        const lastBlockSize = 123;
        const file = new File(['x'.repeat(2 * FILE_CHUNK_SIZE + lastBlockSize)], 'foo.txt');
        const thumbnailData = undefined;
        const { addressPrivateKey, privateKey, sessionKey } = await setupPromise();

        const generator = generateBlocks(
            file,
            thumbnailData,
            addressPrivateKey,
            privateKey,
            sessionKey,
            noop,
            mockHasher
        );
        const blocks = await asyncGeneratorToArray(generator);
        expect(blocks.length).toBe(3);
        expect(blocks.map((block) => block.index)).toMatchObject([1, 2, 3]);
        expect(blocks.map((block) => block.originalSize)).toMatchObject([
            FILE_CHUNK_SIZE,
            FILE_CHUNK_SIZE,
            lastBlockSize,
        ]);
    });

    it('should generate thumbnail as first block', async () => {
        const file = new File(['x'.repeat(2 * FILE_CHUNK_SIZE)], 'foo.txt');
        const thumbnailData = new Uint8Array([1, 2, 3, 3, 2, 1]);
        const { addressPrivateKey, privateKey, sessionKey } = await setupPromise();

        const generator = generateBlocks(
            file,
            thumbnailData,
            addressPrivateKey,
            privateKey,
            sessionKey,
            noop,
            mockHasher
        );
        const blocks = await asyncGeneratorToArray(generator);
        expect(blocks.length).toBe(3);
        expect(blocks.map((block) => block.index)).toMatchObject([0, 1, 2]);
        // Thumbnail has always zero original size to not mess up the progress.
        expect(blocks.map((block) => block.originalSize)).toMatchObject([0, FILE_CHUNK_SIZE, FILE_CHUNK_SIZE]);
    });

    it('should throw and log if there is a consistent encryption error', async () => {
        const lastBlockSize = 123;
        const file = new File(['x'.repeat(2 * FILE_CHUNK_SIZE + lastBlockSize)], 'foo.txt');
        const thumbnailData = undefined;
        const { addressPrivateKey, privateKey, sessionKey } = await setupPromise();

        const encryptSpy = jest.spyOn(CryptoProxy, 'encryptMessage').mockImplementation(async () => {
            // Return some garbage data which will fail validation
            return {
                message: new Uint8Array([1, 2, 3]),
                signature: new Uint8Array([1, 2, 3]),
                encryptedSignature: new Uint8Array([1, 2, 3]),
            };
        });
        const notifySentry = jest.fn();

        const generator = generateBlocks(
            file,
            thumbnailData,
            addressPrivateKey,
            privateKey,
            sessionKey,
            notifySentry,
            mockHasher
        );
        const blocks = asyncGeneratorToArray(generator);

        await expect(blocks).rejects.toThrow();
        expect(encryptSpy).toBeCalled();
        expect(notifySentry).toBeCalled();

        encryptSpy.mockRestore();
    });

    it('should retry and log if there is an encryption error once', async () => {
        const lastBlockSize = 123;
        const file = new File(['x'.repeat(2 * FILE_CHUNK_SIZE + lastBlockSize)], 'foo.txt');
        const thumbnailData = undefined;
        const { addressPrivateKey, privateKey, sessionKey } = await setupPromise();

        let mockCalled = false;
        const encryptSpy = jest.spyOn(CryptoProxy, 'encryptMessage').mockImplementation(async () => {
            // Remove the mock after the first call
            encryptSpy.mockRestore();

            // Since we restore the mock, we can't use .toBeCalled()
            mockCalled = true;

            // Return some garbage data which will fail validation
            return {
                message: new Uint8Array([1, 2, 3]),
                signature: new Uint8Array([1, 2, 3]),
                encryptedSignature: new Uint8Array([1, 2, 3]),
            };
        });
        const notifySentry = jest.fn();

        const generator = generateBlocks(
            file,
            thumbnailData,
            addressPrivateKey,
            privateKey,
            sessionKey,
            notifySentry,
            mockHasher
        );
        const blocks = await asyncGeneratorToArray(generator);

        expect(blocks.length).toBe(3);
        expect(blocks.map((block) => block.index)).toMatchObject([1, 2, 3]);
        expect(blocks.map((block) => block.originalSize)).toMatchObject([
            FILE_CHUNK_SIZE,
            FILE_CHUNK_SIZE,
            lastBlockSize,
        ]);

        // Make sure we logged the error
        expect(mockCalled).toBe(true);
        expect(notifySentry).toBeCalled();
    });

    it('should call the hasher correctly', async () => {
        const hasher: any = {
            process: jest.fn(),
            finish: jest.fn(() => {
                return new Uint8Array([0, 0, 0, 0]);
            }),
        };

        const lastBlockSize = 123;
        const file = new File(['x'.repeat(2 * FILE_CHUNK_SIZE + lastBlockSize)], 'foo.txt');
        const thumbnailData = undefined;
        const { addressPrivateKey, privateKey, sessionKey } = await setupPromise();

        const generator = generateBlocks(file, thumbnailData, addressPrivateKey, privateKey, sessionKey, noop, hasher);

        const blocks = await asyncGeneratorToArray(generator);
        expect(blocks.length).toBe(3);
        // it should have processed the same amount as the blocks
        expect(hasher.process).toHaveBeenCalledTimes(3);
        // the finish function is called by the worker at a higher level
        expect(hasher.finish).not.toHaveBeenCalled();
    });
});
