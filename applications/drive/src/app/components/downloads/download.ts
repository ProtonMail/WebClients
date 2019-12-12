// eslint-disable-next-line import/no-unresolved
import registerServiceWorker from 'service-worker-loader!./downloadSW';
import { isSafari, isEdge } from 'proton-shared/lib/helpers/browser';
import downloadFile from 'proton-shared/lib/helpers/downloadFile';

interface DownloadMeta {
    filename: string;
    mimeType: string;
    size: number;
}
/**
 * Safari and Edge don't support returning stream as a response.
 * Safari - has everything but fails to stream a response from SW.
 * Edge - doesn't support ReadableStream() constructor, will support it in chromium version.
 * For them download is done in-memory using blob response.
 */
let useBlobFallback = isSafari() || isEdge();

function createDownloadIframe(src: string) {
    const iframe = document.createElement('iframe');
    iframe.hidden = true;
    iframe.src = src;
    iframe.name = 'iframe';
    document.body.appendChild(iframe);
    return iframe;
}

async function wakeUpServiceWorker() {
    const worker = navigator.serviceWorker.controller;

    if (worker) {
        worker.postMessage({ action: 'ping' });
    } else {
        const url = location.href.substr(0, location.href.indexOf('/')) + '/sw/ping';
        const res = await fetch(url);
        const body = await res.text();
        if (!res.ok || body !== 'pong') {
            throw new Error('Download worker is dead');
        }
    }
    return worker as ServiceWorker;
}

function serviceWorkerKeepAlive() {
    const interval = setInterval(() => {
        wakeUpServiceWorker().catch(() => clearInterval(interval));
    }, 10000);
}

export async function initDownloadSW() {
    if ('serviceWorker' in navigator) {
        await registerServiceWorker({ scope: '/' });
        serviceWorkerKeepAlive();
    } else {
        useBlobFallback = true;
        throw new Error('Service workers are not supported by this browser');
    }
}

export async function openDownloadStream(
    { filename, mimeType, size }: DownloadMeta,
    { onCancel }: { onCancel: () => void }
) {
    const chunks: Uint8Array[] = [];
    const channel = new MessageChannel();

    const stream = new WritableStream({
        write(block: Uint8Array) {
            if (useBlobFallback) {
                chunks.push(block);
                return;
            }

            channel.port1.postMessage({ action: 'download_chunk', payload: block });
        },
        close() {
            if (useBlobFallback) {
                const blob = new Blob(chunks, { type: 'application/octet-stream; charset=utf-8' });
                downloadFile(blob, filename);
            } else {
                channel.port1.postMessage({ action: 'end' });
            }
        }
    });

    if (!useBlobFallback) {
        const worker = await wakeUpServiceWorker();

        // Channel to stream file contents through
        channel.port1.onmessage = ({ data }) => {
            if (data?.action === 'download_canceled') {
                onCancel();
            } else if (data?.action === 'download_started') {
                createDownloadIframe(data.payload);
            }
        };
        worker.postMessage({ action: 'start_download', payload: { filename, mimeType, size } }, [channel.port2]);
    }

    return stream;
}
