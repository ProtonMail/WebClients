declare const self: ServiceWorkerGlobalScope;

interface DownloadConfig {
    stream: ReadableStream<Uint8Array<ArrayBuffer>>;
    fileName: string;
    mimeType: string;
}

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
                    case 'download_chunk':
                        return controller.enqueue(data.payload);
                    case 'end':
                        return controller.close();
                    case 'abort':
                        return controller.error(new Error(data.reason));
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

    /**
     * Downloads are served from a path relative to the worker scope, so they keep working
     * if the app is ever served from a sub-path.
     */
    private getBasePath = (): string => new URL('sw/', self.registration.scope).pathname;

    onInstall = () => {
        void self.skipWaiting();
    };

    onActivate = (event: ExtendableEvent) => {
        event.waitUntil(self.clients.claim());
    };

    onMessage = (event: ExtendableMessageEvent) => {
        const { data } = event;

        if (data?.action !== 'start_download') {
            return;
        }

        const id = this.generateUID().toString();
        const port = event.ports[0];
        const { fileName, mimeType } = data.payload;

        this.pendingDownloads.set(id, { stream: createDownloadStream(port), fileName, mimeType });

        const downloadUrl = new URL(`${this.getBasePath()}${id}`, self.registration.scope);
        port.postMessage({ action: 'download_started', payload: downloadUrl.toString() });
    };

    onFetch = (event: FetchEvent) => {
        const basePath = this.getBasePath();
        const { pathname } = new URL(event.request.url);

        if (!pathname.startsWith(basePath)) {
            return;
        }

        const id = pathname.slice(basePath.length);
        const pendingDownload = this.pendingDownloads.get(id);

        if (!pendingDownload) {
            return event.respondWith(new Response(null, { status: 404, headers: new Headers(SECURITY_HEADERS) }));
        }

        this.pendingDownloads.delete(id);

        const headers = new Headers({
            'Content-Type': pendingDownload.mimeType,
            'Content-Disposition': `attachment; filename="${encodeURIComponent(pendingDownload.fileName)}"`,
            ...SECURITY_HEADERS,
        });

        event.respondWith(new Response(pendingDownload.stream, { headers }));
    };
}

export default new DownloadServiceWorker();
