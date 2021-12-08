import { ReadableStream } from 'web-streams-polyfill';

import { mergeUint8Arrays } from '@proton/shared/lib/helpers/array';
import { createApiError, createOfflineError } from '@proton/shared/lib/fetch/ApiError';
import { TransferCancel } from '@proton/shared/lib/interfaces/drive/transfer';

import { streamToBuffer } from '../../../utils/stream';
import initDownloadBlocks from './downloadBlocks';

const createNotFoundError = () => createApiError('Error', { status: 404, statusText: 'Not found.' } as Response, {});

const TIME_TO_RESET_RETRIES_LOCAL = 50;

jest.mock('../constants', () => {
    const originalModule = jest.requireActual('../constants');

    return {
        __esModule: true,
        ...originalModule,
        TIME_TO_RESET_RETRIES: TIME_TO_RESET_RETRIES_LOCAL,
    };
});

let offlineURL = '';
let expiredURL = '';
let responseDelay = 0;

const createStreamResponse = (chunks: number[][]) =>
    new ReadableStream<Uint8Array>({
        start(ctrl) {
            chunks.forEach((data) => ctrl.enqueue(new Uint8Array(data)));
            ctrl.close();
        },
    });

const mockDownloadBlock = jest.fn(
    (abortController: AbortController, url: string): Promise<ReadableStream<Uint8Array>> => {
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

describe.only('initDownload', () => {
    beforeEach(() => {
        mockDownloadBlock.mockClear();
        responseDelay = 0;
    });

    it('should download data from remote server using block metadata', async () => {
        const downloadControls = initDownloadBlocks(
            {
                getBlocks: async () => [
                    {
                        Index: 1,
                        BareURL: 'url:1',
                        Token: '1',
                    },
                    {
                        Index: 2,
                        BareURL: 'url:2',
                        Token: '2',
                    },
                    {
                        Index: 3,
                        BareURL: 'url:3',
                        Token: '3',
                    },
                ],
            },
            mockDownloadBlock
        );
        const stream = downloadControls.start();
        const buffer = mergeUint8Arrays(await streamToBuffer(stream));
        expect(buffer).toEqual(new Uint8Array([1, 2, 3, 4, 5, 6, 7, 8, 9]));
    });

    it('should discard downloaded data and finish download on cancel', async () => {
        const promise = new Promise<void>((resolve, reject) => {
            const downloadControls = initDownloadBlocks(
                {
                    getBlocks: async () => [
                        {
                            Index: 1,
                            BareURL: 'url:1',
                            Token: '1',
                        },
                    ],
                    onError: reject,
                    onFinish: () => resolve(),
                },
                mockDownloadBlock
            );
            downloadControls.start();
            downloadControls.cancel();
        });
        await expect(promise).rejects.toThrowError(TransferCancel);
    });

    it('should download data from preloaded data buffer if provided', async () => {
        const sendData = [new Uint8Array([1, 2, 3]), new Uint8Array([4, 5, 6]), new Uint8Array([7, 8, 9])];
        const downloadControls = initDownloadBlocks(
            {
                getBlocks: async () => sendData,
            },
            mockDownloadBlock
        );
        const stream = downloadControls.start();
        const buffer = await streamToBuffer(stream);
        expect(buffer).toEqual(sendData);
    });

    it('should reuse already downloaded data after recovering from network error', async () => {
        offlineURL = 'url:2';
        const downloadControls = initDownloadBlocks(
            {
                getBlocks: async () => [
                    {
                        Index: 1,
                        BareURL: 'url:1',
                        Token: '1',
                    },
                    {
                        Index: 2,
                        BareURL: 'url:2',
                        Token: '2',
                    },
                    {
                        Index: 3,
                        BareURL: 'url:3',
                        Token: '3',
                    },
                    {
                        Index: 4,
                        BareURL: 'url:4',
                        Token: '4',
                    },
                ],
                onNetworkError: (err) => {
                    expect(err).toEqual(createOfflineError({}));
                    // Simulate connection is back up and user clicked to resume download.
                    offlineURL = '';
                    downloadControls.resume();
                },
            },
            mockDownloadBlock
        );
        const stream = downloadControls.start();
        const buffer = mergeUint8Arrays(await streamToBuffer(stream));

        // Every block is streamed only once and in proper order even during interruption.
        expect(buffer).toEqual(new Uint8Array([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11]));
        // Non-failing blocks are downloaded only once.
        expect(mockDownloadBlock.mock.calls.map(([, url]) => url)).toEqual([
            'url:1',
            'url:2',
            'url:3',
            'url:4',
            'url:2',
        ]);
    });

    it('should retry on block expiry', async () => {
        expiredURL = 'url:1';
        let shouldValidateBlock = false;

        const downloadControls = initDownloadBlocks(
            {
                getBlocks: async () => {
                    if (shouldValidateBlock) {
                        expiredURL = '';
                    }

                    shouldValidateBlock = true;

                    return [
                        {
                            Index: 1,
                            BareURL: 'url:1',
                            Token: '1',
                        },
                    ];
                },
            },
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
            {
                getBlocks: async () => {
                    if (blockRetryCount === TIME_BLOCK_EXPIRES) {
                        expiredURL = '';
                    }
                    blockRetryCount++;

                    return [
                        {
                            Index: 1,
                            BareURL: 'url:1',
                            Token: '1',
                        },
                    ];
                },
            },
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
            {
                getBlocks: async () => {
                    return [
                        {
                            Index: 1,
                            BareURL: expiredURL,
                            Token: '1',
                        },
                    ];
                },
            },
            mockDownloadBlock
        );
        const stream = downloadControls.start();
        const bufferPromise = streamToBuffer(stream);

        await expect(bufferPromise).rejects.toThrowError();
        // 1 initial request + 3 retries
        expect(mockDownloadBlock.mock.calls.length).toBe(4);
    });
});
