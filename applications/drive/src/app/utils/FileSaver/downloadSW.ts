import { getRandomString } from 'proton-shared/lib/helpers/string';

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
                if (data?.action === 'end') {
                    return controller.close();
                } else if (data?.action === 'download_chunk') {
                    controller.enqueue(data?.payload);
                }
            };
        },
        cancel() {
            port.postMessage({ action: 'download_canceled' });
        }
    });
}

/**
 * Service worker that listens for client-generated file data
 * and generates a unique link for downloading the data as a file stream.
 */
class DownloadServiceWorker {
    pendingDownloads = new Map();

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
        const url = event.request.url;

        if (url.endsWith('/sw/ping')) {
            return event.respondWith(new Response('pong'));
        }

        const pendingDownload = this.pendingDownloads.get(url);
        if (!pendingDownload) {
            return;
        }

        const { stream, filename, mimeType, size } = pendingDownload;

        this.pendingDownloads.delete(url);

        const headers = new Headers({
            'Content-Length': `${size}`,
            'Content-Type': `${mimeType}`,
            'Content-Disposition': 'attachment; filename=' + `"${encodeURI(filename)}"`,
            'Content-Security-Policy': "default-src 'none'",
            'X-Content-Security-Policy': "default-src 'none'",
            'X-WebKit-CSP': "default-src 'none'",
            'X-XSS-Protection': '1; mode=block'
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

        const downloadUrl = (self as any).registration.scope + `sw/${getRandomString(32)}`;
        const { filename, mimeType, size } = event.data.payload;

        const port = event.ports[0];

        this.pendingDownloads.set(downloadUrl, {
            stream: createDownloadStream(port),
            filename,
            mimeType,
            size,
            port
        });

        port.postMessage({ action: 'download_started', payload: downloadUrl });
    };
}

export default new DownloadServiceWorker();
