import { wait } from '@proton/shared/lib/helpers/promise';
import mergeUint8Arrays from '@proton/utils/mergeUint8Arrays';

import {
    MAX_ENCRYPTED_BLOCKS,
    MAX_UPLOADING_BLOCKS,
    MAX_UPLOAD_JOBS,
    TOKEN_EXPIRATION_TIME,
    WAIT_TIME,
} from '../constants';
import type { EncryptedBlock, Link, ThumbnailEncryptedBlock } from '../interface';
import type { BlockHash, UploadingBlock, UploadingBlockControl } from './interface';
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
    encryptedBlocks = new Map<number, EncryptedBlock>();

    thumbnailsEncryptedBlocks = new Map<number, ThumbnailEncryptedBlock>();

    uploadingBlocks: UploadingBlock[] = [];

    blockHashes: BlockHash[] = [];

    thumbnailBlockHashes: BlockHash[] = [];

    // This is used to verify if total processed block size is the same as file original size
    processedFileSize: number = 0;

    requestingBlockLinks = false;

    encryptionFinished = false;

    uploadingFinished = false;

    async feedEncryptedBlocks(
        encryptedBlocksGenerator: AsyncGenerator<EncryptedBlock>,
        thumbnailsEncryptedBlockGenerator?: AsyncGenerator<ThumbnailEncryptedBlock>
    ) {
        if (thumbnailsEncryptedBlockGenerator) {
            // We don't need the waitForCondition there as we generate a limited number of thumbnails consisting of one small block we don't count for the limit.
            for await (const encryptedThumbnailBlock of thumbnailsEncryptedBlockGenerator) {
                this.thumbnailsEncryptedBlocks.set(encryptedThumbnailBlock.index, encryptedThumbnailBlock);
            }
        }
        for await (const encryptedBlock of encryptedBlocksGenerator) {
            await waitForCondition(
                () =>
                    this.encryptedBlocks.size < MAX_ENCRYPTED_BLOCKS &&
                    this.uploadingBlocks.length < MAX_UPLOADING_BLOCKS
            );
            this.encryptedBlocks.set(encryptedBlock.index, encryptedBlock);
            this.processedFileSize = this.processedFileSize + encryptedBlock.originalSize;
        }

        this.encryptionFinished = true;
    }

    runBlockLinksCreation(
        requestBlockCreation: (blocks: EncryptedBlock[], thumbnailBlocks?: ThumbnailEncryptedBlock[]) => void
    ) {
        const run = async () => {
            if (
                this.encryptedBlocks.size >= MAX_ENCRYPTED_BLOCKS ||
                this.thumbnailsEncryptedBlocks.size >= MAX_ENCRYPTED_BLOCKS ||
                this.uploadingBlocks.length < MAX_UPLOAD_JOBS
            ) {
                const blocks = Array.from(this.encryptedBlocks).map(([, block]) => block);
                const thumbnailBlocks = Array.from(this.thumbnailsEncryptedBlocks).map(([, block]) => block);

                if (blocks.length > 0 || thumbnailBlocks.length > 0) {
                    this.requestingBlockLinks = true;
                    requestBlockCreation(blocks, thumbnailBlocks);
                    await waitForCondition(() => !this.requestingBlockLinks);
                }
            }
            // Even if all blocks are created, it can expire during upload
            // and thus we need to keep checking until the whole upload is
            // completed.
            if (
                this.uploadingFinished &&
                this.encryptionFinished &&
                this.encryptedBlocks.size === 0 &&
                this.thumbnailsEncryptedBlocks.size === 0
            ) {
                return;
            }
            setTimeout(() => {
                void run();
            }, WAIT_TIME);
        };
        void run();
    }

    setBlockLinks(links: Link[], encryptedBlocks: Map<number, EncryptedBlock | ThumbnailEncryptedBlock>) {
        const createTime = Date.now();
        links.forEach((link) => {
            const block = encryptedBlocks.get(link.index);
            if (!block) {
                return;
            }

            this.uploadingBlocks.push({
                block,
                uploadLink: link.url,
                uploadToken: link.token,
                isTokenExpired: () => Date.now() - createTime > TOKEN_EXPIRATION_TIME,
                isThumbnail: !!block.thumbnailType,
            });
            encryptedBlocks.delete(link.index);
        });
    }

    setAllBlockLinks({ fileLinks, thumbnailLinks }: { fileLinks: Link[]; thumbnailLinks?: Link[] }) {
        if (thumbnailLinks) {
            this.setBlockLinks(thumbnailLinks, this.thumbnailsEncryptedBlocks);
        }
        this.setBlockLinks(fileLinks, this.encryptedBlocks);
        this.requestingBlockLinks = false;
    }

    async *generateUploadingBlocks(): AsyncGenerator<UploadingBlockControl> {
        let blocksInProgress = 0;
        while (
            !this.encryptionFinished ||
            this.encryptedBlocks.size > 0 ||
            this.thumbnailsEncryptedBlocks.size > 0 ||
            this.uploadingBlocks.length > 0 ||
            blocksInProgress > 0
        ) {
            await waitForCondition(() => this.encryptionFinished || this.uploadingBlocks.length > 0);
            const uploadingBlock = this.uploadingBlocks.shift();
            if (uploadingBlock) {
                const { block, uploadLink, uploadToken, isTokenExpired, isThumbnail } = uploadingBlock;
                blocksInProgress++;
                yield {
                    ...block,
                    uploadLink,
                    uploadToken,
                    isTokenExpired,
                    // eslint-disable-next-line @typescript-eslint/no-loop-func
                    finish: () => {
                        blocksInProgress--;
                        if (isThumbnail) {
                            this.thumbnailBlockHashes.push({
                                index: block.index,
                                hash: block.hash,
                            });
                        } else {
                            this.blockHashes.push({
                                index: block.index,
                                hash: block.hash,
                            });
                        }
                    },
                    // eslint-disable-next-line @typescript-eslint/no-loop-func
                    onTokenExpiration: () => {
                        blocksInProgress--;
                        if (block.thumbnailType) {
                            this.thumbnailsEncryptedBlocks.set(block.index, block);
                        } else {
                            this.encryptedBlocks.set(block.index, block);
                        }
                    },
                };
            } else {
                // Wait to not block the thread by infinite loop when encryption is finished.
                await wait(WAIT_TIME);
            }
        }
        this.uploadingFinished = true;
    }

    get hash(): Uint8Array<ArrayBuffer> {
        this.thumbnailBlockHashes.sort((a, b) => a.index - b.index);
        this.blockHashes.sort((a, b) => a.index - b.index);
        const hashes = [
            ...this.thumbnailBlockHashes.map(({ hash }) => hash),
            ...this.blockHashes.map(({ hash }) => hash),
        ];
        return mergeUint8Arrays(hashes);
    }

    get uploadedBlockCount(): number {
        return this.blockHashes.length + this.thumbnailBlockHashes.length;
    }

    get totalProcessedSize(): number {
        return this.processedFileSize;
    }
}
