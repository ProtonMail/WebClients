/* eslint-disable no-restricted-globals */

interface DownloadConfig {
    stream: ReadableStream<Uint8Array>;
    filename: string;
    mimeType: string;
    size?: number;
}

const SECURITY_HEADERS = {
    'Content-Security-Policy': "default-src 'none'",
    'X-Content-Security-Policy': "default-src 'none'",
    'X-WebKit-CSP': "default-src 'none'",
    'Referrer-Policy': 'strict-origin-when-cross-origin',
    'Strict-Transport-Security': 'max-age=31536000',
    'X-Content-Type-Options': 'nosniff',
    'X-Frame-Options': 'deny',
    'X-XSS-Protection': '1; mode=block',
    'X-Permitted-Cross-Domain-Policies': 'none',
};

/**
 * Open a stream of data passed over MessageChannel.
 * Every download has it's own stream from app to SW.
 *
 * @param port MessageChannel port to listen on
 */
function createDownloadStream(port: MessagePort) {
    return new ReadableStream({
        start(controller: ReadableStreamDefaultController) {
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

/**
 * Service worker that listens for client-generated file data
 * and generates a unique link for downloading the data as a file stream.
 */
class DownloadServiceWorker {
    pendingDownloads = new Map<string, DownloadConfig>();

    id = 1;

    constructor() {
        self.addEventListener('install', this.onInstall);
        self.addEventListener('activate', this.onActivate);
        self.addEventListener('message', this.onMessage);
        self.addEventListener('fetch', this.onFetch);
    }

    onInstall = () => {
        (self as any).skipWaiting();
    };

    onActivate = (event: any) => {
        event.waitUntil((self as any).clients.claim());
    };

    /**
     * Intercepts requests on the generated download url
     * and responds with a stream, that client itself controls.
     */
    onFetch = (event: any) => {
        const url = new URL(event.request.url);

        // Ignore non SW urls
        if (!url.pathname.startsWith('/sw')) {
            return;
        }

        // Respond to pings
        if (url.pathname.endsWith('/sw/ping')) {
            return event.respondWith(new Response('pong', { headers: new Headers(SECURITY_HEADERS) }));
        }

        const chunks = url.pathname.split('/').filter((item) => !!item);
        const id = chunks[chunks.length - 1];

        const pendingDownload = this.pendingDownloads.get(id);

        if (!pendingDownload) {
            event.respondWith(
                new Response(undefined, {
                    status: 404,
                    headers: new Headers(SECURITY_HEADERS),
                })
            );

            return;
        }

        const { stream, filename, size, mimeType } = pendingDownload;

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
     * Called once before each download, opens a stream for file data
     * and generates a unique download link for the app to call to download file.
     */
    onMessage = (event: any) => {
        if (event.data?.action !== 'start_download') {
            return;
        }

        const id = this.id++;

        const { filename, mimeType, size } = event.data.payload;
        const downloadUrl = new URL(`/sw/${id}`, (self as any).registration.scope);

        const port = event.ports[0];

        this.pendingDownloads.set(`${id}`, {
            stream: createDownloadStream(port),
            filename,
            mimeType,
            size,
        });

        port.postMessage({ action: 'download_started', payload: downloadUrl.toString() });
    };
}

export default new DownloadServiceWorker();
