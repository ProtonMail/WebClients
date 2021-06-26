import { ReadableStream } from 'web-streams-polyfill';

import { mergeUint8Arrays } from '@proton/shared/lib/helpers/array';
import { createOfflineError } from '@proton/shared/lib/fetch/ApiError';

import { streamToBuffer } from '../../utils/stream';
import { TransferCancel } from '../../interfaces/transfer';
import { initDownload } from './download';

describe('initDownload', () => {
    const createStreamResponse = (chunks: number[][]) =>
        new ReadableStream<Uint8Array>({
            start(ctrl) {
                chunks.forEach((data) => ctrl.enqueue(new Uint8Array(data)));
                ctrl.close();
            },
        });

    let offlineURL = '';
    const mockApi = jest.fn().mockImplementation(async ({ url }: { url: 'url:1' | 'url:2' | 'url:3' | 'url:4' }) => {
        if (url === offlineURL) {
            throw createOfflineError({});
        }
        return {
            'url:1': createStreamResponse([[1, 2], [3]]),
            'url:2': createStreamResponse([[4], [5, 6]]),
            'url:3': createStreamResponse([[7, 8, 9]]),
            'url:4': createStreamResponse([[10, 11]]),
        }[url];
    });

    beforeEach(() => {
        mockApi.mockClear();
    });

    it('should download data from remote server using block metadata', async () => {
        const buffer = new Promise<ReadableStream<Uint8Array>>((resolve, reject) => {
            const { downloadControls } = initDownload({
                onStart: resolve,
                getBlocks: async () => [
                    {
                        Index: 1,
                        URL: 'url:1',
                    },
                    {
                        Index: 2,
                        URL: 'url:2',
                    },
                    {
                        Index: 3,
                        URL: 'url:3',
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
                        URL: 'url:1',
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
                        URL: 'url:1',
                    },
                    {
                        Index: 2,
                        URL: 'url:2',
                    },
                    {
                        Index: 3,
                        URL: 'url:3',
                    },
                    {
                        Index: 4,
                        URL: 'url:4',
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
});
