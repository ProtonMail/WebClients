import { isMobile, isSafari } from '@proton/shared/lib/helpers/browser';
import { stripLeadingAndTrailingSlash } from '@proton/shared/lib/helpers/string';
import { PUBLIC_PATH } from '@proton/shared/lib/webpack.constants';

import type { TransferMeta } from '../../../components/TransferManager/transfer';

let workerWakeupInterval: ReturnType<typeof setInterval>;

export const isServiceWorkersSupported = () => {
    return 'serviceWorker' in navigator;
};

export const isOPFSSupported = async () => {
    // Get the OPFS root directory
    // Firefox has a bug where sometimes it fails to getDirectoy
    // DOMException: Security error when calling GetDirectory
    // Considered we haven't started the download yet, we fallback to SW download
    // https://webcompat.com/issues/128011
    // https://bugzilla.mozilla.org/show_bug.cgi?id=1875283
    // https://bugzilla.mozilla.org/show_bug.cgi?id=1942530
    try {
        await navigator.storage.getDirectory();
        return !isSafari() && !isMobile();
    } catch {
        return false;
    }
};

// createDownloadIframe opens download URL created in service worker to
// initialize the download in the browser. The response has headers to
// act as the download. See DownloadServiceWorker for more info.
function createDownloadIframe(src: string) {
    const iframe = document.createElement('iframe');
    iframe.hidden = true;
    iframe.src = src;
    iframe.name = 'iframe';
    document.body.appendChild(iframe);
    return iframe;
}

async function wakeUpServiceWorker(retry = true) {
    const worker = navigator.serviceWorker.controller;

    if (worker) {
        worker.postMessage({ action: 'ping' });
    } else {
        const url = [
            document.location.href.substring(0, document.location.href.indexOf('/')),
            stripLeadingAndTrailingSlash(PUBLIC_PATH),
            'sw/ping',
        ]
            .filter(Boolean)
            .join('/');
        const res = await fetch(url);
        const body = await res.text();
        if (!res.ok || body !== 'pong') {
            if (!retry) {
                throw new Error('Download worker is not active');
            }
            console.warn('Download worker is not active, retrying registration');
            await initDownloadSW();
            await wakeUpServiceWorker(false);
        }
    }
    return worker;
}

function serviceWorkerKeepAlive() {
    clearInterval(workerWakeupInterval);
    workerWakeupInterval = setInterval(() => {
        wakeUpServiceWorker().catch(() => clearInterval(workerWakeupInterval));
    }, 10000);
}

export async function initDownloadSW() {
    // wait Service Worker is registered
    await navigator.serviceWorker.register(
        /* webpackChunkName: "downloadSW" */
        new URL('./downloadSW', import.meta.url),
        {
            scope: `/${stripLeadingAndTrailingSlash(PUBLIC_PATH)}`,
        }
    );

    // wait Service Worker is in Active
    await navigator.serviceWorker.ready;

    // wait Service Worker to be claimed by current page
    if (!navigator.serviceWorker.controller) {
        await new Promise((resolve) => {
            navigator.serviceWorker.addEventListener('controllerchange', resolve, { once: true });
        });
    }

    serviceWorkerKeepAlive();
}

/**
 * Opens download stream into service worker. Use abort signal when pipeTo can't close the download stream.
 */
export async function openDownloadStream(
    meta: TransferMeta,
    { onCancel, abortSignal }: { onCancel: () => void; abortSignal?: AbortSignal }
) {
    const channel = new MessageChannel();
    const stream = new WritableStream({
        write(block: Uint8Array) {
            channel.port1.postMessage({ action: 'download_chunk', payload: block });
        },
        close() {
            channel.port1.postMessage({ action: 'end' });
        },
        abort(reason) {
            channel.port1.postMessage({ action: 'abort', reason: String(reason) });
        },
    });

    if (abortSignal) {
        abortSignal.addEventListener('abort', () => {
            channel.port1.postMessage({ action: 'abort', reason: 'Download stream aborted' });
        });
    }

    const worker = await wakeUpServiceWorker();

    if (worker == null) {
        throw new Error('Download worker is not active');
    }

    // Channel to stream file contents through
    channel.port1.onmessage = ({ data }) => {
        if (data?.action === 'download_canceled') {
            onCancel();
        } else if (data?.action === 'download_started') {
            createDownloadIframe(data.payload);
        }
    };
    worker.postMessage({ action: 'start_download', payload: meta }, [channel.port2]);

    return stream;
}
