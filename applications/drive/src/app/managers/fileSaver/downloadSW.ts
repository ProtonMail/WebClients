import { LRUMap, type VideoStream, getBlockIndices, getChunkFromBlocksData, parseRange } from './streaming';

declare const self: ServiceWorkerGlobalScope;

interface DownloadConfig {
    stream: ReadableStream<Uint8Array<ArrayBuffer>>;
    filename: string;
    mimeType: string;
    size?: number;
}

type SetVideoStreamMessage = {
    type: 'set_video_stream';
    blockSizes: number[];
    id: string;
    mimeType: string;
};

type GetBlockDataRequest = {
    type: 'get_block_data';
    indices: number[];
};

type BlockDataResponse = Uint8Array<ArrayBuffer>[];

const SECURITY_HEADERS = {
    'Content-Security-Policy': "default-src 'none'; frame-ancestors 'self'",
    'X-Content-Security-Policy': "default-src 'none'",
    'X-WebKit-CSP': "default-src 'none'",
    'Referrer-Policy': 'strict-origin-when-cross-origin',
    'Strict-Transport-Security': 'max-age=31536000',
    'X-Content-Type-Options': 'nosniff',
    'X-XSS-Protection': '1; mode=block',
    'X-Permitted-Cross-Domain-Policies': 'none',
};

const VIDEO_STREAMING_BLOCK_TIMEOUT = 30 * 1000;

/**
 * Timeout for retrieving next chunk of data from the client.
 * It must allow to:
 *  - finish previous operation (read of previous requested chunks; 10 seconds)
 *  - download up to two blocks of data and decrypt them (90 seconds each)
 */
const VIDEO_STREAMING_TIMEOUT = (10 + 90 + 90) * 1000;

const MAXIMUM_BLOCKS_CACHE = 3; // (4MB * 3 = 12MB)

const MAXIMUM_CONCURRENT_STREAMS = 3;

/**
 * Open a stream of data passed over MessageChannel.
 * Every download has its own stream from app to SW.
 * @param port MessageChannel port to listen on
 */
function createDownloadStream(port: MessagePort) {
    return new ReadableStream<Uint8Array<ArrayBuffer>>({
        start(controller) {
            port.onmessage = ({ data }) => {
                switch (data?.action) {
                    case 'end':
                        return controller.close();
                    case 'download_chunk':
                        return controller.enqueue(data?.payload);
                    case 'abort':
                        return controller.error(data?.reason);
                    default:
                        console.error(`received unknown action "${data?.action}"`);
                }
            };
        },
        cancel() {
            port.postMessage({ action: 'download_canceled' });
        },
    });
}

class DownloadServiceWorker {
    pendingDownloads = new Map<string, DownloadConfig>();

    /**
     * A counter used to generate IDs for `pendingDownloads`
     */
    downloadId = 1;

    // Video streaming range-serving
    // Maximum 3 simultaneous streams
    private videoStreams: LRUMap<string, VideoStream> = new LRUMap(MAXIMUM_CONCURRENT_STREAMS);

    constructor() {
        self.addEventListener('install', this.onInstall);
        self.addEventListener('activate', this.onActivate);
        self.addEventListener('message', this.onMessage);
        self.addEventListener('fetch', this.onFetch);
    }

    private generateUID = (): number => {
        if (this.downloadId > 9000) {
            this.downloadId = 0;
        }
        return this.downloadId++;
    };

    onInstall = () => {
        void self.skipWaiting();
    };

    onActivate = (event: ExtendableEvent) => {
        event.waitUntil(self.clients.claim());
    };

    /**
     * Handle both download links and video range requests
     */
    onFetch = (event: FetchEvent) => {
        const url = new URL(event.request.url);

        // Our service worker is registered on the global scope
        // We currently only care about the /sw/* scope
        if (!url.pathname.startsWith('/sw')) {
            return;
        }

        // The main thread periodically wakes up the service worker with a ping
        if (url.pathname.endsWith('/sw/ping')) {
            return event.respondWith(new Response('pong', { headers: new Headers(SECURITY_HEADERS) }));
        }

        // Video range requests: /sw/video/{id}
        const videoMatch = url.pathname.startsWith('/sw/video/');
        // getStream get the video stream from the Map
        // Consider the ID is sent via postMessage
        // its technically async so can technically paint the DOM before the message reach the SW (theoritically)
        // So we're awaiting 5 second maximum if not defined (50 times x 100ms)
        const getStream = async (id: string, t = 50): Promise<VideoStream | undefined> =>
            this.videoStreams.get(id) ||
            (t > 0
                ? await new Promise<VideoStream | undefined>((r) => setTimeout(() => r(getStream(id, t - 1)), 100))
                : undefined);

        if (event.request.method === 'GET' && videoMatch) {
            event.respondWith(
                (async () => {
                    try {
                        const id = url.pathname.split('/sw/video/')[1];
                        const videoStream = await getStream(id);
                        const rangeHeader = event.request.headers.get('Range');

                        if (!rangeHeader || !videoStream) {
                            return new Response(null, {
                                status: 400,
                                statusText: 'Bad Request - Missing range header or video stream',
                                headers: new Headers(SECURITY_HEADERS),
                            });
                        }

                        const range = parseRange(rangeHeader, videoStream);
                        if (!range) {
                            return new Response(null, {
                                status: 416,
                                statusText: 'Range Not Satisfiable',
                                headers: new Headers({
                                    'Content-Range': `bytes */${videoStream.totalSize}`,
                                    ...SECURITY_HEADERS,
                                }),
                            });
                        }

                        const { start, end } = range;
                        const indices = getBlockIndices(start, end, videoStream);

                        const client = await self.clients.get(event.clientId);
                        if (!client) {
                            return new Response(null, {
                                status: 500,
                                statusText: 'Client not found',
                                headers: new Headers(SECURITY_HEADERS),
                            });
                        }

                        const channel = new MessageChannel();
                        const blockData: Promise<BlockDataResponse> = new Promise((resolve, reject) => {
                            const timeout = setTimeout(() => {
                                reject(new Error('Block data request timeout'));
                            }, VIDEO_STREAMING_BLOCK_TIMEOUT);

                            channel.port1.onmessage = (msg) => {
                                clearTimeout(timeout);
                                resolve(msg.data as BlockDataResponse);
                            };
                        });

                        // Get blocks from cache and track which indices need to be fetched
                        const cachedBlocks = new Map<number, Uint8Array<ArrayBuffer>>();
                        const indicesToFetch = [];

                        for (const index of indices) {
                            const cache = videoStream.cache.get(index);
                            if (cache) {
                                cachedBlocks.set(index, cache);
                            } else {
                                indicesToFetch.push(index);
                            }
                        }

                        // Only fetch blocks that aren't in cache
                        const fetchedBlocks = new Map<number, Uint8Array<ArrayBuffer>>();
                        if (indicesToFetch.length > 0) {
                            client.postMessage(
                                { type: 'get_block_data', indices: indicesToFetch } as GetBlockDataRequest,
                                [channel.port2]
                            );
                            const blocks = await blockData;

                            for (let i = 0; i < indicesToFetch.length; i++) {
                                const index = indicesToFetch[i];
                                fetchedBlocks.set(index, blocks[i]);
                            }
                        }

                        // Merge cached and fetched blocks in original indices order
                        const finalBlocks: Uint8Array<ArrayBuffer>[] = [];
                        for (const index of indices) {
                            const cache = cachedBlocks.get(index);
                            if (cache) {
                                finalBlocks.push(cache);
                                continue;
                            }
                            const fetched = fetchedBlocks.get(index);
                            if (fetched) {
                                finalBlocks.push(fetched);
                            }
                        }

                        // Update cache with newly fetched blocks
                        for (const [index, block] of fetchedBlocks) {
                            videoStream.cache.set(index, block);
                        }

                        const chunk = getChunkFromBlocksData(range, finalBlocks, indices, videoStream.blockSizes);

                        const headers = new Headers({
                            'Content-Range': `bytes ${start}-${end}/${videoStream.totalSize}`,
                            'Accept-Ranges': 'bytes',
                            'Content-Length': chunk.byteLength.toString(),
                            'Content-Type': videoStream.mimeType,
                            ...SECURITY_HEADERS,
                        });

                        return new Response(chunk, { status: 206, statusText: 'Partial Content', headers });
                    } catch (error) {
                        console.error('Error handling video range request:', error);
                        return new Response(null, {
                            status: 500,
                            statusText: 'Internal Server Error',
                            headers: new Headers(SECURITY_HEADERS),
                        });
                    }
                })()
            );
            return;
        }

        // Stream range requests: /sw/stream/{id}
        const streamMatch = url.pathname.startsWith('/sw/stream/');
        if (event.request.method === 'GET' && streamMatch) {
            event.respondWith(
                (async () => {
                    try {
                        const streamId = url.pathname.split('/sw/stream/')[1];
                        const rangeHeader = event.request.headers.get('Range');

                        if (!rangeHeader) {
                            return new Response(null, {
                                status: 400,
                                statusText: 'Bad Request - Missing range header',
                                headers: new Headers(SECURITY_HEADERS),
                            });
                        }

                        const rangeMatch = /bytes=(\d+)-(\d*)/.exec(rangeHeader);
                        if (!rangeMatch) {
                            return new Response(null, {
                                status: 400,
                                statusText: 'Bad Request - Invalid range header format',
                                headers: new Headers(SECURITY_HEADERS),
                            });
                        }

                        const start = parseInt(rangeMatch[1], 10);
                        const end = rangeMatch[2] ? parseInt(rangeMatch[2], 10) : undefined;

                        const client = await self.clients.get(event.clientId);
                        if (!client) {
                            return new Response(null, {
                                status: 500,
                                statusText: 'Client not found',
                                headers: new Headers(SECURITY_HEADERS),
                            });
                        }

                        const channel = new MessageChannel();
                        const resultPromise: Promise<{
                            data: Uint8Array<ArrayBuffer>;
                            claimedTotalSize?: number;
                            mimeType: string;
                        }> = new Promise((resolve, reject) => {
                            const timeout = setTimeout(() => {
                                reject(new Error('Stream chunk request timeout'));
                            }, VIDEO_STREAMING_TIMEOUT);

                            channel.port1.onmessage = (msg) => {
                                clearTimeout(timeout);
                                resolve(msg.data);
                            };
                        });

                        // For open-ended ranges, request a reasonable chunk size
                        const requestedEnd = end ?? start + 4 * 1024 * 1024 - 1;

                        client.postMessage(
                            {
                                type: 'get_stream_chunk',
                                streamId,
                                range: [start, requestedEnd] as [number, number],
                            },
                            [channel.port2]
                        );

                        const result = await resultPromise;

                        const actualEnd = start + result.data.byteLength - 1;
                        const totalSize = result.claimedTotalSize ?? actualEnd + 1;

                        // Ensure it is own copy of data for reading by the consumer.
                        const data = new Uint8Array(result.data);

                        const headers = new Headers({
                            'Content-Range': `bytes ${start}-${actualEnd}/${totalSize}`,
                            'Accept-Ranges': 'bytes',
                            'Content-Length': data.byteLength.toString(),
                            'Content-Type': result.mimeType,
                            ...SECURITY_HEADERS,
                        });

                        return new Response(data, { status: 206, statusText: 'Partial Content', headers });
                    } catch (error) {
                        console.error('Error handling stream range request:', error);
                        return new Response(null, {
                            status: 500,
                            statusText: error instanceof Error ? error.message : 'Internal Server Error',
                            headers: new Headers(SECURITY_HEADERS),
                        });
                    }
                })()
            );
            return;
        }

        // Download link handling
        const parts = url.pathname.split('/').filter(Boolean);
        const id = parts[parts.length - 1];
        const pending = this.pendingDownloads.get(id);

        if (!pending) {
            return event.respondWith(
                new Response(undefined, {
                    status: 404,
                    headers: new Headers(SECURITY_HEADERS),
                })
            );
        }

        const { stream, filename, mimeType, size } = pending;
        this.pendingDownloads.delete(id);

        const headers = new Headers({
            ...(size ? { 'Content-Length': `${size}` } : {}),
            'Content-Type': mimeType,
            'Content-Disposition': `attachment; filename="${encodeURIComponent(filename)}"`,
            ...SECURITY_HEADERS,
        });

        event.respondWith(new Response(stream, { headers }));
    };

    /**
     * Handle messages for both download and video block config
     */
    onMessage = (event: ExtendableMessageEvent) => {
        const data = event.data;

        // Video stream initializer
        if (data?.type === 'set_video_stream') {
            const msg = data as SetVideoStreamMessage;
            this.videoStreams.set(msg.id, {
                blockSizes: msg.blockSizes,
                totalSize: msg.blockSizes.reduce((sum, s) => sum + s, 0),
                mimeType: msg.mimeType,
                cache: new LRUMap<number, Uint8Array<ArrayBuffer>>(MAXIMUM_BLOCKS_CACHE),
            });
            return;
        }

        // Download initiation
        if (data?.action === 'start_download') {
            const id = this.generateUID().toString();
            const { filename, mimeType, size } = data.payload;
            const port = event.ports[0];

            this.pendingDownloads.set(id, {
                stream: createDownloadStream(port),
                filename,
                mimeType,
                size,
            });

            const downloadUrl = new URL(`/sw/${id}`, self.registration.scope);
            port.postMessage({ action: 'download_started', payload: downloadUrl.toString() });
        }
    };
}

export default new DownloadServiceWorker();
