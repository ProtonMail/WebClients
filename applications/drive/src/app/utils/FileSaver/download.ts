// eslint-disable-next-line import/no-unresolved, import/no-webpack-loader-syntax
import registerServiceWorker from 'service-worker-loader!./downloadSW';
import { isSafari, isEdge, isEdgeChromium, isIos } from '@proton/shared/lib/helpers/browser';
import { WritableStream } from 'web-streams-polyfill';
import { stripLeadingAndTrailingSlash } from '@proton/shared/lib/helpers/string';
import { PUBLIC_PATH } from '@proton/shared/lib/constants';
import { TransferMeta } from '../../interfaces/transfer';

/**
 * Safari and Edge don't support returning stream as a response.
 * Safari - has everything but fails to stream a response from SW.
 * Edge - doesn't support ReadableStream() constructor, but supports it in chromium version.
 * IOS - forces all browsers to use webkit, so same problems as safari in all browsers.
 * For them download is done in-memory using blob response.
 */
export const isUnsupported = () =>
    !('serviceWorker' in navigator) || isSafari() || (isEdge() && !isEdgeChromium()) || isIos();

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
        const url = [
            document.location.href.substr(0, document.location.href.indexOf('/')),
            stripLeadingAndTrailingSlash(PUBLIC_PATH),
            'sw/ping',
        ]
            .filter(Boolean)
            .join('/');
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
    if (isUnsupported()) {
        throw new Error('Saving file via download is unsupported by this browser');
    }
    await registerServiceWorker({ scope: `/${stripLeadingAndTrailingSlash(PUBLIC_PATH)}` });
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
