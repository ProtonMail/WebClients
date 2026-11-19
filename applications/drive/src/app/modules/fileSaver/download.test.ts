import { MessageChannel as NodeMessageChannel } from 'node:worker_threads';

import { getServiceWorkerDownloadMeta, openDownloadStream } from './download';

describe('getServiceWorkerDownloadMeta', () => {
    const meta = { downloadId: 'id', filename: 'file.bin', mimeType: 'application/octet-stream', size: 1024 };

    it('should drop the size outside iOS so no Content-Length is sent', () => {
        expect(getServiceWorkerDownloadMeta(meta, false)).toEqual({ ...meta, size: undefined });
    });

    it('should keep the size on iOS', () => {
        expect(getServiceWorkerDownloadMeta(meta, true)).toEqual(meta);
    });
});

const CHUNK_SIZE = 1024 * 1024;
const CHUNK_COUNT = 50;

const META = {
    downloadId: 'download-1',
    filename: 'big.bin',
    mimeType: 'application/octet-stream',
    size: CHUNK_SIZE * CHUNK_COUNT,
};

const waitForMessages = () => new Promise((resolve) => setTimeout(resolve, 50));

const connectPageToServiceWorker = async () => {
    const { default: serviceWorker } = await import('./downloadSW');

    Object.defineProperty(navigator, 'serviceWorker', {
        configurable: true,
        value: {
            controller: {
                postMessage: (data: unknown, ports?: MessagePort[]) => {
                    if (ports) {
                        serviceWorker.onMessage(
                            Object.assign(new Event('message'), {
                                data,
                                ports,
                                origin: '',
                                lastEventId: '',
                                source: null,
                                waitUntil: jest.fn(),
                            })
                        );
                    }
                },
            },
        },
    });

    return serviceWorker;
};

const openBrowserDownload = async (serviceWorker: Awaited<ReturnType<typeof connectPageToServiceWorker>>) => {
    await waitForMessages();
    const iframe = document.querySelector('iframe');
    if (!iframe) {
        throw new Error('Download iframe was not created');
    }

    let response: Response | undefined;
    const fetchEvent = Object.assign(new Event('fetch'), {
        request: new Request(iframe.src),
        clientId: '',
        resultingClientId: '',
        handled: Promise.resolve(undefined),
        preloadResponse: Promise.resolve(undefined),
        waitUntil: jest.fn(),
        respondWith: (value: Response) => {
            response = value;
        },
    });
    serviceWorker.onFetch(fetchEvent);

    if (!response?.body) {
        throw new Error('Service worker did not answer the download request');
    }
    return response.body.getReader();
};

describe('openDownloadStream backpressure', () => {
    beforeAll(() => {
        Object.defineProperty(globalThis, 'MessageChannel', { value: NodeMessageChannel, configurable: true });
        Object.defineProperty(self, 'registration', { value: { scope: 'http://localhost/' }, configurable: true });
    });

    afterEach(() => {
        document.body.innerHTML = '';
    });

    it('stops accepting chunks while the browser is not reading the download', async () => {
        const serviceWorker = await connectPageToServiceWorker();
        const writable = await openDownloadStream(META, { onCancel: jest.fn() });
        const browserReader = await openBrowserDownload(serviceWorker);

        const writer = writable.getWriter();
        let acceptedChunks = 0;
        const writes = Array.from({ length: CHUNK_COUNT }, (_, index) =>
            writer.write(new Uint8Array(CHUNK_SIZE).fill(index % 256)).then(() => {
                acceptedChunks++;
            })
        );
        await waitForMessages();

        // Browser is stuck (slow disk, Save As dialog) --> page must hold back --> SDK pauses
        expect(acceptedChunks).toBeLessThanOrEqual(2);

        const receivedFirstBytes: number[] = [];
        for (let index = 0; index < CHUNK_COUNT; index++) {
            const { value } = await browserReader.read();
            receivedFirstBytes.push(value?.[0] ?? -1);
        }
        await Promise.all(writes);
        await writer.close();
        await waitForMessages();

        expect(acceptedChunks).toBe(CHUNK_COUNT);
        expect(receivedFirstBytes).toEqual(Array.from({ length: CHUNK_COUNT }, (_, index) => index % 256));
        expect((await browserReader.read()).done).toBe(true);
    });

    it('lets the download be aborted while waiting for the browser to read', async () => {
        const serviceWorker = await connectPageToServiceWorker();
        const writable = await openDownloadStream(META, { onCancel: jest.fn() });
        await openBrowserDownload(serviceWorker);

        const writer = writable.getWriter();
        const writes = Array.from({ length: 3 }, () => writer.write(new Uint8Array(CHUNK_SIZE)).catch(() => {}));
        await waitForMessages();

        await expect(writer.abort(new Error('Transfer canceled'))).resolves.toBeUndefined();
        await Promise.all(writes);
    });

    it('releases waiting writes when the abort signal fires', async () => {
        const serviceWorker = await connectPageToServiceWorker();
        const abortController = new AbortController();
        const writable = await openDownloadStream(META, {
            onCancel: jest.fn(),
            abortSignal: abortController.signal,
        });
        await openBrowserDownload(serviceWorker);

        const writer = writable.getWriter();
        const writes = Array.from({ length: 3 }, () => writer.write(new Uint8Array(CHUNK_SIZE)));
        await waitForMessages();

        abortController.abort();
        const results = await Promise.allSettled(writes);

        expect(results.map(({ status }) => status)).toEqual(['fulfilled', 'rejected', 'rejected']);
    });

    it('keeps sending chunks to an older service worker that never asks for them', async () => {
        const postedChunks: unknown[] = [];
        Object.defineProperty(navigator, 'serviceWorker', {
            configurable: true,
            value: {
                controller: {
                    postMessage: (_data: unknown, ports?: MessagePort[]) => {
                        const port = ports?.[0];
                        if (!port) {
                            return;
                        }
                        port.onmessage = ({ data }) => {
                            if (data?.action === 'download_chunk') {
                                postedChunks.push(data.payload);
                            }
                        };
                        port.postMessage({ action: 'download_started', payload: 'http://localhost/sw/1' });
                    },
                },
            },
        });
        const writer = (await openDownloadStream(META, { onCancel: jest.fn() })).getWriter();

        await Promise.all(Array.from({ length: 5 }, () => writer.write(new Uint8Array(CHUNK_SIZE))));
        await waitForMessages();

        expect(postedChunks).toHaveLength(5);
    });
});
