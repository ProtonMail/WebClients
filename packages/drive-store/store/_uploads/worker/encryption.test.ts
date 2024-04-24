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
import { EncryptedBlock, ThumbnailEncryptedBlock } from '../interface';
import { ThumbnailInfo, ThumbnailType } from '../media';
import { generateEncryptedBlocks, generateThumbnailEncryptedBlocks } from './encryption';
import { Verifier } from './interface';
import { createVerifier } from './verifier';

jest.setTimeout(20000);

describe('block generator', () => {
    const mockLogCallback = jest.fn();

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
        update: noop,
        digest: () => new Uint8Array([1, 2, 3, 4]),
    };

    // Mock implementation of a verifier that always succeeds
    const mockVerifier: Verifier = () => {
        return Promise.resolve(new Uint8Array(Array(32)));
    };

    it('should generate all file blocks', async () => {
        const lastBlockSize = 123;
        const file = new File(['x'.repeat(2 * FILE_CHUNK_SIZE + lastBlockSize)], 'foo.txt');
        const { addressPrivateKey, privateKey, sessionKey } = await setupPromise();

        const generator = generateEncryptedBlocks(
            file,
            addressPrivateKey,
            privateKey,
            sessionKey,
            noop,
            mockHasher,
            mockVerifier,
            mockLogCallback
        );
        const blocks = await asyncGeneratorToArray<EncryptedBlock>(generator);
        expect(blocks.length).toBe(3);
        expect(blocks.map((block) => block.index)).toMatchObject([1, 2, 3]);
        expect(blocks.map((block) => block.originalSize)).toMatchObject([
            FILE_CHUNK_SIZE,
            FILE_CHUNK_SIZE,
            lastBlockSize,
        ]);
    });

    it('should generate all thumbnails blocks', async () => {
        const thumbnailData: ThumbnailInfo[] = [
            {
                thumbnailData: new Uint8Array([1, 2, 3, 3, 2, 1]),
                thumbnailType: ThumbnailType.PREVIEW,
            },
            {
                thumbnailData: new Uint8Array([1, 2, 3, 3, 2, 1]),
                thumbnailType: ThumbnailType.HD_PREVIEW,
            },
        ];
        const { addressPrivateKey, sessionKey } = await setupPromise();

        const generator = generateThumbnailEncryptedBlocks(
            thumbnailData,
            addressPrivateKey,
            sessionKey,
            mockLogCallback
        );
        const blocks = await asyncGeneratorToArray<ThumbnailEncryptedBlock>(generator);
        expect(blocks.length).toBe(2);
        expect(blocks.map((block) => block.index)).toMatchObject([0, 1]);
        // Thumbnail has always zero original size to not mess up the progress.
        expect(blocks.map((block) => block.originalSize)).toMatchObject([0, 0]);
    });

    it('should throw and log if there is a consistent encryption error', async () => {
        const lastBlockSize = 123;
        const file = new File(['x'.repeat(2 * FILE_CHUNK_SIZE + lastBlockSize)], 'foo.txt');
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

        const verifier = createVerifier({
            verificationCode: new Uint8Array([1, 2, 3]),
            verifierSessionKey: sessionKey,
        });

        const generator = generateEncryptedBlocks(
            file,
            addressPrivateKey,
            privateKey,
            sessionKey,
            notifySentry,
            mockHasher,
            verifier,
            mockLogCallback
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

        const verifier = createVerifier({
            verificationCode: new Uint8Array([1, 2, 3]),
            verifierSessionKey: sessionKey,
        });

        const generator = generateEncryptedBlocks(
            file,
            addressPrivateKey,
            privateKey,
            sessionKey,
            notifySentry,
            mockHasher,
            verifier,
            mockLogCallback
        );
        const blocks = await asyncGeneratorToArray<EncryptedBlock>(generator);

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
            update: jest.fn(),
            digest: jest.fn(() => new Uint8Array([0, 0, 0, 0])),
        };

        const lastBlockSize = 123;
        const file = new File(['x'.repeat(2 * FILE_CHUNK_SIZE + lastBlockSize)], 'foo.txt');
        const { addressPrivateKey, privateKey, sessionKey } = await setupPromise();

        const generator = generateEncryptedBlocks(
            file,
            addressPrivateKey,
            privateKey,
            sessionKey,
            noop,
            hasher,
            mockVerifier,
            mockLogCallback
        );

        const blocks = await asyncGeneratorToArray(generator);
        expect(blocks.length).toBe(3);
        // it should have processed the same amount as the blocks
        expect(hasher.update).toHaveBeenCalledTimes(3);
        // the finish function is called by the worker at a higher level
        expect(hasher.digest).not.toHaveBeenCalled();
    });

    describe('verifier usage', () => {
        [0, 1, 17, 6 * 1024 * 1024].forEach(async (fileSize) => {
            const blockCount = Math.ceil(fileSize / FILE_CHUNK_SIZE);

            it(`should call the verifier and attach ${blockCount} tokens for ${fileSize} bytes`, async () => {
                const { addressPrivateKey, privateKey, sessionKey } = await setupPromise();

                const file = new File(['a'.repeat(fileSize)], 'foo.txt');

                const verifier = jest.fn(mockVerifier);
                const generator = generateEncryptedBlocks(
                    file,
                    addressPrivateKey,
                    privateKey,
                    sessionKey,
                    noop,
                    mockHasher,
                    verifier,
                    mockLogCallback
                );

                const blocks = await asyncGeneratorToArray(generator);

                expect(blocks.length).toBe(blockCount);
                expect(verifier).toHaveBeenCalledTimes(blockCount);

                blocks.forEach((block) => {
                    if (!('verificationToken' in block)) {
                        fail('Verification token should be in generated block data');
                    }

                    expect(block.verificationToken).toStrictEqual(new Uint8Array(new Array(32)));
                });
            });
        });

        it(`should throw if the verifier throws and notify sentry`, async () => {
            const { addressPrivateKey, privateKey, sessionKey } = await setupPromise();

            const file = new File(['a'.repeat(32)], 'foo.txt');

            const verifier = jest.fn(() => Promise.reject(new Error('oh no')));
            const notifySentry = jest.fn();
            const generator = generateEncryptedBlocks(
                file,
                addressPrivateKey,
                privateKey,
                sessionKey,
                notifySentry,
                mockHasher,
                verifier,
                mockLogCallback
            );

            const blocks = asyncGeneratorToArray(generator);

            await expect(blocks).rejects.toThrow();
            expect(notifySentry).toBeCalled();
        });
    });
});
