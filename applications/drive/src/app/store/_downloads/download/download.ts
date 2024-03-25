import { SupportedMimeTypes } from '@proton/shared/lib/drive/constants';

import { TransferCancel } from '../../../components/TransferManager/transfer';
import fileSaver from '../fileSaver/fileSaver';
import { DownloadCallbacks, DownloadControls, DownloadStreamControls, LinkDownload, LogCallback } from '../interface';
import initDownloadLinkFile from './downloadLinkFile';
import initDownloadLinkFolder from './downloadLinkFolder';
import initDownloadLinks from './downloadLinks';

/**
 * SIZE_WAIT_TIME limits how long wait before initializing download by browser.
 * The download is already progressing during that time, it just waits for info
 * to properly decide whether to use streaming or buffering solution.
 * 5 seconds is probably reasonable number to have plenty of time to prefer
 * buffer solution (more probably faster one) in most cases, but not waiting
 * too long to not buffer too much of data in memory (to fit in memory), and
 * also in case of using streaming solution to show the download more quickly
 * to user (to have nicer UX).
// See SizeTimeoutPromise for more information.
 */
const SIZE_WAIT_TIME = 5000; // ms

/**
 * initDownload prepares controls for downloading either file, folder or set
 * of files, based on the provided links.
 * One file link: the file is downloaded directly.
 * One folder link: archive is generated, all childs are in the root.
 * Many links: archive is generated, all files are in the root.
 */
export default function initDownload(
    name: string,
    links: LinkDownload[],
    callbacks: DownloadCallbacks,
    log: LogCallback,
    options?: { virusScan?: boolean }
): DownloadControls {
    let gotErr: any;
    const sizePromise = new SizeTimeoutPromise(SIZE_WAIT_TIME);
    const controls = getControls(
        links,
        {
            ...callbacks,
            onInit: (size, linkSizes) => {
                callbacks.onInit?.(size, linkSizes);
                sizePromise.set(size);
            },
            onError: (err) => {
                callbacks.onError?.(err);
                gotErr = err;
            },
        },
        log,
        options
    );
    return {
        ...controls,
        start: async () => {
            const stream = controls.start();
            const size = await sizePromise.get().catch(() => undefined);
            await fileSaver
                .saveAsFile(stream, {
                    filename: name,
                    mimeType: links.length === 1 ? links[0].mimeType : SupportedMimeTypes.zip,
                    size,
                })
                .catch((err) => {
                    callbacks.onError?.(err);
                    controls.cancel();
                    throw err;
                });
            if (gotErr) {
                throw gotErr;
            }
            callbacks.onFinish?.();
        },
        cancel: () => {
            gotErr = new TransferCancel({ message: `Transfer canceled` });
            controls.cancel();
        },
    };
}

export function initDownloadStream(links: LinkDownload[], callbacks: DownloadCallbacks) {
    // Stream is used in direct preview. There we do not support logs just yet.
    const noLog = () => {};
    return getControls(links, callbacks, noLog);
}

function getControls(
    links: LinkDownload[],
    callbacks: DownloadCallbacks,
    log: LogCallback,
    options?: { virusScan?: boolean }
): DownloadStreamControls {
    if (links.length === 1) {
        const link = links[0];
        if (link.isFile) {
            return initDownloadLinkFile(link, callbacks, log, options);
        }
        return initDownloadLinkFolder(link, callbacks, log, options);
    }
    return initDownloadLinks(links, callbacks, log, options);
}

/**
 * Loading deep folder structure can take awhile, but we don't want to wait
 * till the whole structure is loaded before we start actually downloading
 * the files. The issue is, FileSaver needs to know the size to properly
 * decide whether to use service worker (for huge files) or simpler buffer
 * solution (for small files). We can say if the size is not known in some
 * reasonable time, then the structure is huge and archive probably big.
 * If the size is not provided, service worker solution is used by default.
 * There is still fallback if service worker is not working, so this is good
 * enough precision.
 */
class SizeTimeoutPromise {
    promise: Promise<number>;

    resolve?: (value: number) => void;

    constructor(timeout: number) {
        let reject: (err?: any) => void;
        this.promise = new Promise((_resolve, _reject) => {
            this.resolve = _resolve;
            reject = _reject;
        });
        setTimeout(() => reject(), timeout);
    }

    set(size: number) {
        this.resolve?.(size);
    }

    async get() {
        return this.promise;
    }
}
