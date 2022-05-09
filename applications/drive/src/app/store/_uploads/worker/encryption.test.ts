import { FILE_CHUNK_SIZE } from '@proton/shared/lib/drive/constants';
import {
    setupCryptoProxyForTesting,
    releaseCryptoProxy,
    generatePrivateKey,
    generateSessionKey,
} from '../../../utils/test/crypto';
import { asyncGeneratorToArray } from '../../../utils/test/generator';
import generateBlocks from './encryption';

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

    it('should generate all file blocks', async () => {
        const lastBlockSize = 123;
        const file = new File(['x'.repeat(2 * FILE_CHUNK_SIZE + lastBlockSize)], 'foo.txt');
        const thumbnailData = undefined;
        const { addressPrivateKey, privateKey, sessionKey } = await setupPromise();

        const generator = generateBlocks(file, thumbnailData, addressPrivateKey, privateKey, sessionKey);
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

        const generator = generateBlocks(file, thumbnailData, addressPrivateKey, privateKey, sessionKey);
        const blocks = await asyncGeneratorToArray(generator);
        expect(blocks.length).toBe(3);
        expect(blocks.map((block) => block.index)).toMatchObject([0, 1, 2]);
        // Thumbnail has always zero original size to not mess up the progress.
        expect(blocks.map((block) => block.originalSize)).toMatchObject([0, FILE_CHUNK_SIZE, FILE_CHUNK_SIZE]);
    });
});
