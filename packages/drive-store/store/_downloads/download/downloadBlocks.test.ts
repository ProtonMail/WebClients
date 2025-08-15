import { waitFor } from '@testing-library/react';

import { createApiError, createOfflineError } from '@proton/shared/lib/fetch/ApiError';
import type { DriveFileBlock } from '@proton/shared/lib/interfaces/drive/file';
import mergeUint8Arrays from '@proton/utils/mergeUint8Arrays';

import { TransferCancel } from '../../../components/TransferManager/transfer';
import { streamToBuffer } from '../../../utils/stream';
import * as constants from '../constants';
import initDownloadBlocks from './downloadBlocks';

const createNotFoundError = () => createApiError('Error', { status: 404, statusText: 'Not found.' } as Response, {});

const TIME_TO_RESET_RETRIES_LOCAL = 50; // Milliseconds.

jest.mock('../constants');
const mockConstants = constants as jest.MockedObject<typeof constants>;

let offlineURL = '';
let expiredURL = '';
let responseDelay = 0;

const createStreamResponse = (chunks: number[][]) =>
    new ReadableStream<Uint8Array<ArrayBuffer>>({
        start(ctrl) {
            chunks.forEach((data) => ctrl.enqueue(new Uint8Array(data)));
            ctrl.close();
        },
    });

const createGetBlocksResponse = (blocks: DriveFileBlock[], manifestSignature = '') => {
    return {
        blocks,
        manifestSignature,
        thumbnailHashes: [''],
        xAttr: 'SomeEncoded',
    };
};

const mockTransformBlockStream = async (abortSignal: AbortSignal, stream: ReadableStream<Uint8Array<ArrayBuffer>>) => {
    return {
        hash: [] as unknown as Uint8Array<ArrayBuffer>,
        data: stream,
    };
};

const mockDownloadBlock = jest.fn(
    (abortController: AbortController, url: string): Promise<ReadableStream<Uint8Array<ArrayBuffer>>> => {
        return new Promise((resolve, reject) => {
            setTimeout(() => {
                if (url === offlineURL) {
                    reject(createOfflineError({}));
                    return;
                }

                if (url === expiredURL) {
                    reject(createNotFoundError());
                    return;
                }

                const response = {
                    'url:1': createStreamResponse([[1, 2], [3]]),
                    'url:2': createStreamResponse([[4], [5, 6]]),
                    'url:3': createStreamResponse([[7, 8, 9]]),
                    'url:4': createStreamResponse([[10, 11]]),
                }[url];

                if (!response) {
                    reject(new Error(`Unexpected url "${url}"`));
                    return;
                }
                resolve(response);
            }, responseDelay);
        });
    }
);

describe('initDownload', () => {
    const mockLog = jest.fn();

    beforeAll(() => {
        jest.spyOn(global.console, 'warn').mockReturnValue();
    });

    beforeEach(() => {
        mockDownloadBlock.mockClear();
        mockConstants.TIME_TO_RESET_RETRIES = TIME_TO_RESET_RETRIES_LOCAL;
        responseDelay = 0;
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    it('should download data from remote server using block metadata', async () => {
        const downloadControls = initDownloadBlocks(
            'filename',
            {
                getBlocks: async () =>
                    createGetBlocksResponse([
                        {
                            Index: 1,
                            BareURL: 'url:1',
                            Token: '1',
                            Hash: 'aewdsh',
                        },
                        {
                            Index: 2,
                            BareURL: 'url:2',
                            Token: '2',
                            Hash: 'aewdsh',
                        },
                        {
                            Index: 3,
                            BareURL: 'url:3',
                            Token: '3',
                            Hash: 'aewdsh',
                        },
                    ]),
                transformBlockStream: mockTransformBlockStream,
            },
            mockLog,
            mockDownloadBlock
        );
        const stream = downloadControls.start();
        const buffer = mergeUint8Arrays(await streamToBuffer(stream));
        expect(buffer).toEqual(new Uint8Array([1, 2, 3, 4, 5, 6, 7, 8, 9]));
    });

    it('should call scanForVirus if passed as callback', async () => {
        const mockScanForVirus = jest.fn();
        const mockCheckFileHash = jest.fn();
        const downloadControls = initDownloadBlocks(
            'filename',
            {
                getBlocks: async () =>
                    createGetBlocksResponse([
                        {
                            Index: 1,
                            BareURL: 'url:1',
                            Token: '1',
                            Hash: 'aewdsh',
                        },
                        {
                            Index: 2,
                            BareURL: 'url:2',
                            Token: '2',
                            Hash: 'aewdsh',
                        },
                        {
                            Index: 3,
                            BareURL: 'url:3',
                            Token: '3',
                            Hash: 'aewdsh',
                        },
                    ]),
                transformBlockStream: mockTransformBlockStream,
                scanForVirus: mockScanForVirus,
                checkFileHash: mockCheckFileHash,
            },
            mockLog,
            mockDownloadBlock
        );
        const stream = downloadControls.start();
        mergeUint8Arrays(await streamToBuffer(stream));
        await waitFor(() => {
            expect(mockScanForVirus.mock.calls).toHaveLength(1);
            expect(mockCheckFileHash.mock.calls).toHaveLength(1);
        });
    });

    it('should discard downloaded data and finish download on cancel', async () => {
        const promise = new Promise<void>((resolve, reject) => {
            const downloadControls = initDownloadBlocks(
                'filename',
                {
                    getBlocks: async () =>
                        createGetBlocksResponse([
                            {
                                Index: 1,
                                BareURL: 'url:1',
                                Token: '1',
                                Hash: 'aewdsh',
                            },
                        ]),
                    transformBlockStream: mockTransformBlockStream,
                    onError: reject,
                    onFinish: () => resolve(),
                },
                mockLog,
                mockDownloadBlock
            );
            downloadControls.start();
            downloadControls.cancel();
        });
        await expect(promise).rejects.toThrowError(TransferCancel);
    });

    it('should reuse already downloaded data after recovering from network error', async () => {
        // Make sure to not reset retries counter during the test.
        mockConstants.TIME_TO_RESET_RETRIES = 10000;

        offlineURL = 'url:2';
        const downloadControls = initDownloadBlocks(
            'filename',
            {
                getBlocks: async () =>
                    createGetBlocksResponse([
                        {
                            Index: 1,
                            BareURL: 'url:1',
                            Token: '1',
                            Hash: 'aewdsh',
                        },
                        {
                            Index: 2,
                            BareURL: 'url:2',
                            Token: '2',
                            Hash: 'ewqcd',
                        },
                        {
                            Index: 3,
                            BareURL: 'url:3',
                            Token: '3',
                            Hash: 'qwesd',
                        },
                        {
                            Index: 4,
                            BareURL: 'url:4',
                            Token: '4',
                            Hash: 'dqweda',
                        },
                    ]),
                transformBlockStream: mockTransformBlockStream,
                onNetworkError: (err) => {
                    expect(err).toEqual(createOfflineError({}));
                    // Simulate connection is back up and user clicked to resume download.
                    offlineURL = '';
                    downloadControls.resume();
                },
            },
            mockLog,
            mockDownloadBlock
        );
        const stream = downloadControls.start();
        const buffer = mergeUint8Arrays(await streamToBuffer(stream));

        // Every block is streamed only once and in proper order even during interruption.
        expect(buffer).toEqual(new Uint8Array([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11]));
        // Non-failing blocks are downloaded only once.
        expect(mockDownloadBlock.mock.calls.map(([, url]) => url)).toEqual([
            'url:1',
            'url:2', // First attempt.
            'url:3',
            'url:4',
            // First retry (retry tries again all blocks in the queue).
            'url:2',
            'url:3',
            'url:4',
            // Second retry.
            'url:2',
            'url:3',
            'url:4',
            // Third retry.
            'url:2',
            'url:3',
            'url:4',
            // Second attempt after resume and fixing the issue.
            'url:2',
        ]);
    });

    it('should retry on block expiry', async () => {
        expiredURL = 'url:1';
        let shouldValidateBlock = false;

        const downloadControls = initDownloadBlocks(
            'filename',
            {
                getBlocks: async () => {
                    if (shouldValidateBlock) {
                        expiredURL = '';
                    }

                    shouldValidateBlock = true;

                    return createGetBlocksResponse([
                        {
                            Index: 1,
                            BareURL: 'url:1',
                            Token: '1',
                            Hash: 'aewdsh',
                        },
                    ]);
                },
                transformBlockStream: mockTransformBlockStream,
            },
            mockLog,
            mockDownloadBlock
        );
        const stream = downloadControls.start();
        const buffer = mergeUint8Arrays(await streamToBuffer(stream));

        // Expired block is streamed once after retry.
        expect(buffer).toEqual(new Uint8Array([1, 2, 3]));
        // Expired block gets requested.
        expect(mockDownloadBlock.mock.calls.map(([, url]) => url)).toEqual(['url:1', 'url:1']);
    });

    it('should re-request expired blocks', async () => {
        // the download speed is sooo slow that the block will expire 4 times
        const TIME_BLOCK_EXPIRES = 4;
        // making sure response time is greater than
        // consecutive retry counter threshold
        responseDelay = TIME_TO_RESET_RETRIES_LOCAL * 2;
        let blockRetryCount = 0;
        expiredURL = 'url:1';

        const downloadControls = initDownloadBlocks(
            'filename',
            {
                getBlocks: async () => {
                    if (blockRetryCount === TIME_BLOCK_EXPIRES) {
                        expiredURL = '';
                    }
                    blockRetryCount++;

                    return createGetBlocksResponse([
                        {
                            Index: 1,
                            BareURL: 'url:1',
                            Token: '1',
                            Hash: 'aewdsh',
                        },
                    ]);
                },
                transformBlockStream: mockTransformBlockStream,
            },
            mockLog,
            mockDownloadBlock
        );
        const stream = downloadControls.start();
        const buffer = mergeUint8Arrays(await streamToBuffer(stream));

        expect(buffer).toEqual(new Uint8Array([1, 2, 3]));
        // initial + TIME_BLOCK_EXPIRES
        expect(mockDownloadBlock.mock.calls.length).toBe(1 + TIME_BLOCK_EXPIRES);
    });

    it('should request new block exactly three times if request fails consequentially', async () => {
        expiredURL = 'url:1';

        const downloadControls = initDownloadBlocks(
            'filename',
            {
                getBlocks: async () => {
                    return createGetBlocksResponse([
                        {
                            Index: 1,
                            BareURL: expiredURL,
                            Token: '1',
                            Hash: 'aewdsh',
                        },
                    ]);
                },
                transformBlockStream: mockTransformBlockStream,
            },
            mockLog,
            mockDownloadBlock
        );
        const stream = downloadControls.start();
        const bufferPromise = streamToBuffer(stream);

        await expect(bufferPromise).rejects.toThrowError();
        // 1 initial request + 3 retries
        expect(mockDownloadBlock.mock.calls.length).toBe(4);
    });
});
