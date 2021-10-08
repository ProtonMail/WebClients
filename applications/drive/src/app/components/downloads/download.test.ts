import { ReadableStream } from 'web-streams-polyfill';

import { mergeUint8Arrays } from '@proton/shared/lib/helpers/array';
import { createApiError, createOfflineError } from '@proton/shared/lib/fetch/ApiError';
import { TransferCancel } from '@proton/shared/lib/interfaces/drive/transfer';

import { streamToBuffer } from '../../utils/stream';
import { initDownload } from './download';

const createNotFoundError = () => createApiError('Error', { status: 404, statusText: 'Not found.' } as Response, {});

const TIME_TO_RESET_RETRIES_LOCAL = 50;

jest.mock('./constants', () => {
    const originalModule = jest.requireActual('./constants');

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

const mockApi = jest.fn(({ url }: { url: 'url:1' | 'url:2' | 'url:3' | 'url:4' }) => {
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

            resolve(
                {
                    'url:1': createStreamResponse([[1, 2], [3]]),
                    'url:2': createStreamResponse([[4], [5, 6]]),
                    'url:3': createStreamResponse([[7, 8, 9]]),
                    'url:4': createStreamResponse([[10, 11]]),
                }[url]
            );
        }, responseDelay);
    });
});

describe.only('initDownload', () => {
    beforeEach(() => {
        mockApi.mockClear();
        responseDelay = 0;
    });

    it('should download data from remote server using block metadata', async () => {
        const buffer = new Promise<ReadableStream<Uint8Array>>((resolve, reject) => {
            const { downloadControls } = initDownload({
                onStart: resolve,
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
            });
            downloadControls.start(mockApi).catch(reject);
        })
            .then(streamToBuffer)
            .then(mergeUint8Arrays);

        await expect(buffer).resolves.toEqual(new Uint8Array([1, 2, 3, 4, 5, 6, 7, 8, 9]));
    });

    it('should discard downloaded data and finish download on cancel', async () => {
        const buffer = new Promise<ReadableStream<Uint8Array>>((resolve, reject) => {
            const { downloadControls } = initDownload({
                onStart: resolve,
                getBlocks: async () => [
                    {
                        Index: 1,
                        BareURL: 'url:1',
                        Token: '1',
                    },
                ],
            });
            downloadControls.start(mockApi).catch(reject);
            downloadControls.cancel();
        })
            .then(streamToBuffer)
            .then(mergeUint8Arrays);

        await expect(buffer).rejects.toThrowError(TransferCancel);
    });

    it('should download data from preloaded data buffer if provided', async () => {
        const sendData = [new Uint8Array([1, 2, 3]), new Uint8Array([4, 5, 6]), new Uint8Array([7, 8, 9])];

        const buffer = new Promise<ReadableStream<Uint8Array>>((resolve, reject) => {
            const { downloadControls } = initDownload({
                onStart: resolve,
                getBlocks: async () => sendData,
            });
            downloadControls.start(jest.fn()).catch(reject);
        }).then(streamToBuffer);

        await expect(buffer).resolves.toEqual(sendData);
    });

    it('should reuse already downloaded data after recovering from network error', async () => {
        offlineURL = 'url:2';
        const buffer = new Promise<ReadableStream<Uint8Array>>((resolve, reject) => {
            const { downloadControls } = initDownload({
                onStart: resolve,
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
                onNetworkError: (id, err) => {
                    expect(err).toEqual(createOfflineError({}));
                    // Simulate connection is back up and user clicked to resume download.
                    offlineURL = '';
                    downloadControls.resume();
                },
            });
            downloadControls.start(mockApi).catch(reject);
        })
            .then(streamToBuffer)
            .then(mergeUint8Arrays);

        // Every block is streamed only once and in proper order even during interruption.
        await expect(buffer).resolves.toEqual(new Uint8Array([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11]));
        // Non-failing blocks are downloaded only once.
        expect(mockApi.mock.calls.map(([{ url }]) => url)).toEqual(['url:1', 'url:2', 'url:3', 'url:4', 'url:2']);
    });

    it('should retry on block expiry', async () => {
        expiredURL = 'url:1';
        let shouldValidateBlock = false;

        const buffer = new Promise<ReadableStream<Uint8Array>>((resolve, reject) => {
            const { downloadControls } = initDownload({
                onStart: resolve,
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
            });
            downloadControls.start(mockApi).catch(reject);
        })
            .then(streamToBuffer)
            .then(mergeUint8Arrays);

        // Expired block is streamed once after retry.
        await expect(buffer).resolves.toEqual(new Uint8Array([1, 2, 3]));
        // Expired block gets requested.
        expect(mockApi.mock.calls.map(([{ url }]) => url)).toEqual(['url:1', 'url:1']);
    });

    it('should re-request expired blocks', async () => {
        // the download speed is sooo slow that the block will expire 4 times
        const TIME_BLOCK_EXPIRES = 4;
        // making sure response time is greater than
        // consecutive retry counter threshold
        responseDelay = TIME_TO_RESET_RETRIES_LOCAL * 2;
        let blockRetryCount = 0;
        expiredURL = 'url:1';

        const buffer = new Promise<ReadableStream<Uint8Array>>((resolve, reject) => {
            const { downloadControls } = initDownload({
                onStart: resolve,
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
            });
            downloadControls.start(mockApi).catch(reject);
        })
            .then(streamToBuffer)
            .then(mergeUint8Arrays);

        await expect(buffer).resolves.toEqual(new Uint8Array([1, 2, 3]));

        // initial + TIME_BLOCK_EXPIRES
        expect(mockApi.mock.calls.map(([{ url }]) => url).length).toBe(1 + TIME_BLOCK_EXPIRES);
    });

    it('should request new block exactly three times if request fails consequentially', async () => {
        expiredURL = 'url:1';

        const buffer = new Promise<ReadableStream<Uint8Array>>((resolve, reject) => {
            const { downloadControls } = initDownload({
                onStart: resolve,
                getBlocks: async () => {
                    return [
                        {
                            Index: 1,
                            BareURL: 'url:1',
                            Token: '1',
                        },
                    ];
                },
            });
            downloadControls.start(mockApi).catch(reject);
        }).then(streamToBuffer);

        await expect(buffer).rejects.toThrowError();
        // 1 initial request + 3 retries
        expect(mockApi.mock.calls.map(([{ url }]) => url).length).toBe(4);
    });
});
