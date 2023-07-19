import { wait } from '@proton/shared/lib/helpers/promise';
import mergeUint8Arrays from '@proton/utils/mergeUint8Arrays';

import {
    MAX_ENCRYPTED_BLOCKS,
    MAX_UPLOADING_BLOCKS,
    MAX_UPLOAD_JOBS,
    TOKEN_EXPIRATION_TIME,
    WAIT_TIME,
} from '../constants';
import { EncryptedBlock, EncryptedThumbnailBlock, Link } from '../interface';
import { BlockHash, UploadingBlock, UploadingBlockControl } from './interface';
import { waitForCondition } from './pauser';

/**
 * UploadWorkerBuffer holds buffers of encrypted and uploaded blocks.
 * At one time it holds maximum of MAX_ENCRYPTED_BLOCKS + MAX_UPLOADING_BLOCKS
 * blocks. Encrypted buffer is feeded through generator. When there is not
 * enough uploading blocks (MAX_UPLOAD_JOBS), it takes whatever is encrypted
 * and asks API to create those blocks on backend. Once links are returned back
 * to the worker, those blocks are transfered from encrypted buffer to uploading
 * buffer. Upload jobs can get them using also generator.
 *
 * The example of usage and the flow is as following:
 *
 * const buffer = new UploadWorkerBuffer();
 * buffer.feedEncryptedBlocks(encryptedBlocksGenerator);
 * buffer.runBlockLinksCreation(requestBlockCreation);
 * worker.onmesasge((data) => buffer.setBlockLinks(data.links));
 * for await(const block of buffer.generateUploadingBlocks()) {
 *      uploadBlock(block);
 * }
 */
export default class UploadWorkerBuffer {
    encryptedBlocks = new Map<number, EncryptedBlock | EncryptedThumbnailBlock>();

    uploadingBlocks: UploadingBlock[] = [];

    blockHashes: BlockHash[] = [];

    requestingBlockLinks = false;

    encryptionFinished = false;

    uploadingFinished = false;

    async feedEncryptedBlocks(encryptedBlocksGenerator: AsyncGenerator<EncryptedBlock | EncryptedThumbnailBlock>) {
        for await (const encryptedBlock of encryptedBlocksGenerator) {
            await waitForCondition(
                () =>
                    this.encryptedBlocks.size < MAX_ENCRYPTED_BLOCKS &&
                    this.uploadingBlocks.length < MAX_UPLOADING_BLOCKS
            );
            this.encryptedBlocks.set(encryptedBlock.index, encryptedBlock);
        }
        this.encryptionFinished = true;
    }

    runBlockLinksCreation(
        requestBlockCreation: (blocks: EncryptedBlock[], thumbnailBlock?: EncryptedThumbnailBlock) => void
    ) {
        const run = async () => {
            if (this.encryptedBlocks.size >= MAX_ENCRYPTED_BLOCKS || this.uploadingBlocks.length < MAX_UPLOAD_JOBS) {
                const blocks = Array.from(this.encryptedBlocks)
                    .map(([, block]) => block)
                    .filter((block) => block.index !== 0) as EncryptedBlock[];
                const thumbnailBlock = this.encryptedBlocks.get(0);
                if (blocks.length > 0) {
                    this.requestingBlockLinks = true;
                    requestBlockCreation(blocks, thumbnailBlock);
                    await waitForCondition(() => !this.requestingBlockLinks);
                }
            }
            // Even if all blocks are created, it can expire during upload
            // and thus we need to keep checking until the whole upload is
            // completed.
            if (this.uploadingFinished && this.encryptionFinished && this.encryptedBlocks.size === 0) {
                return;
            }
            setTimeout(() => {
                void run();
            }, WAIT_TIME);
        };
        void run();
    }

    setBlockLinks(links: Link[]) {
        const createTime = Date.now();
        links.forEach((link) => {
            const block = this.encryptedBlocks.get(link.index);
            if (!block) {
                return;
            }

            this.uploadingBlocks.push({
                block,
                uploadLink: link.url,
                uploadToken: link.token,
                isTokenExpired: () => Date.now() - createTime > TOKEN_EXPIRATION_TIME,
            });
            this.encryptedBlocks.delete(link.index);
        });
        this.requestingBlockLinks = false;
    }

    async *generateUploadingBlocks(): AsyncGenerator<UploadingBlockControl> {
        let blocksInProgress = 0;
        while (
            !this.encryptionFinished ||
            this.encryptedBlocks.size > 0 ||
            this.uploadingBlocks.length > 0 ||
            blocksInProgress > 0
        ) {
            await waitForCondition(() => this.encryptionFinished || this.uploadingBlocks.length > 0);
            const uploadingBlock = this.uploadingBlocks.shift();
            if (uploadingBlock) {
                const { block, uploadLink, uploadToken, isTokenExpired } = uploadingBlock;
                blocksInProgress++;
                yield {
                    ...block,
                    uploadLink,
                    uploadToken,
                    isTokenExpired,
                    // eslint-disable-next-line @typescript-eslint/no-loop-func
                    finish: () => {
                        blocksInProgress--;
                        this.blockHashes.push({
                            index: block.index,
                            hash: block.hash,
                        });
                    },
                    // eslint-disable-next-line @typescript-eslint/no-loop-func
                    onTokenExpiration: () => {
                        blocksInProgress--;
                        this.encryptedBlocks.set(block.index, block);
                    },
                };
            } else {
                // Wait to not block the thread by infinite loop when encryption is finished.
                await wait(WAIT_TIME);
            }
        }
        this.uploadingFinished = true;
    }

    get hash(): Uint8Array {
        this.blockHashes.sort((a, b) => a.index - b.index);
        const hashes = this.blockHashes.map(({ hash }) => hash);
        return mergeUint8Arrays(hashes);
    }
}
