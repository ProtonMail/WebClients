import { promiseWithTimeout } from '@proton/shared/lib/helpers/promise';
import { stripLeadingAndTrailingSlash } from '@proton/shared/lib/helpers/string';
import { PUBLIC_PATH } from '@proton/shared/lib/webpack.constants';

const SERVICE_WORKER_TIMEOUT = 15_000;
const SERVICE_WORKER_KEEP_ALIVE_INTERVAL = 10_000;

let keepAliveInterval: ReturnType<typeof setInterval> | undefined;

export const isServiceWorkerDownloadSupported = () => 'serviceWorker' in navigator;

const startKeepAlive = () => {
    clearInterval(keepAliveInterval);
    keepAliveInterval = setInterval(() => {
        navigator.serviceWorker.controller?.postMessage({ action: 'ping' });
    }, SERVICE_WORKER_KEEP_ALIVE_INTERVAL);
};

const stopKeepAlive = () => {
    clearInterval(keepAliveInterval);
    keepAliveInterval = undefined;
};

const createDownloadIframe = (source: string) => {
    const iframe = document.createElement('iframe');
    iframe.hidden = true;
    iframe.src = source;
    document.body.appendChild(iframe);
};

const registerDownloadServiceWorker = async () => {
    await navigator.serviceWorker.register(
        /* webpackChunkName: "downloadSW" */
        new URL('./downloadSW', import.meta.url),
        { scope: `/${stripLeadingAndTrailingSlash(PUBLIC_PATH)}` }
    );

    await navigator.serviceWorker.ready;

    if (!navigator.serviceWorker.controller) {
        await new Promise((resolve) => {
            navigator.serviceWorker.addEventListener('controllerchange', resolve, { once: true });
        });
    }
};

const wakeUpServiceWorker = async () => {
    if (navigator.serviceWorker.controller) {
        navigator.serviceWorker.controller.postMessage({ action: 'ping' });
        return navigator.serviceWorker.controller;
    }

    await registerDownloadServiceWorker();

    if (!navigator.serviceWorker.controller) {
        throw new Error('Download service worker is not active');
    }

    return navigator.serviceWorker.controller;
};

export const openDownloadStream = async (
    { fileName, mimeType }: { fileName: string; mimeType: string },
    { onCancel }: { onCancel: () => void }
): Promise<WritableStream<Uint8Array<ArrayBuffer>>> => {
    const worker = await promiseWithTimeout({
        promise: wakeUpServiceWorker(),
        timeoutMs: SERVICE_WORKER_TIMEOUT,
        errorMessage: 'Download service worker registration timed out',
    });

    const channel = new MessageChannel();

    const downloadStarted = new Promise<void>((resolve) => {
        channel.port1.onmessage = ({ data }) => {
            if (data?.action === 'download_started') {
                createDownloadIframe(data.payload);
                resolve();
            } else if (data?.action === 'download_canceled') {
                onCancel();
            }
        };
    });

    worker.postMessage({ action: 'start_download', payload: { fileName, mimeType } }, [channel.port2]);

    await promiseWithTimeout({
        promise: downloadStarted,
        timeoutMs: SERVICE_WORKER_TIMEOUT,
        errorMessage: 'Download service worker did not start the download',
    });

    startKeepAlive();

    return new WritableStream<Uint8Array<ArrayBuffer>>({
        write(chunk) {
            channel.port1.postMessage({ action: 'download_chunk', payload: chunk });
        },
        close() {
            channel.port1.postMessage({ action: 'end' });
            stopKeepAlive();
        },
        abort(reason) {
            channel.port1.postMessage({ action: 'abort', reason: String(reason) });
            stopKeepAlive();
        },
    });
};
