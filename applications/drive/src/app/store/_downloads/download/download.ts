import { SupportedMimeTypes } from '@proton/shared/lib/drive/constants';
import type { Api } from '@proton/shared/lib/interfaces';

import { TransferCancel } from '../../../components/TransferManager/transfer';
import { HEARTBEAT_MAX_REFRESH_TIME, HEARTBEAT_WAIT_TIME } from '../constants';
import fileSaver from '../fileSaver/fileSaver';
import type {
    DownloadCallbacks,
    DownloadControls,
    DownloadStreamControls,
    LinkDownload,
    LogCallback,
} from '../interface';
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
    isNewFolderTreeAlgorithmEnabled: boolean,
    api: Api,
    options?: { virusScan?: boolean }
): DownloadControls {
    let gotErr: any;
    const heartbeat = new HeartbeatTimeout(log);

    const sizePromise = new SizeTimeoutPromise(SIZE_WAIT_TIME);
    const controls = getControls(
        links,
        {
            onInit: (size, linkSizes) => {
                callbacks.onInit?.(size, linkSizes);
                sizePromise.set(size);
                heartbeat.refreshTimeout();
            },
            onProgress: (...args) => {
                callbacks.onProgress?.(...args);
                heartbeat.refreshTimeout();
            },
            onSignatureIssue: async (...args) => {
                heartbeat.pauseTimeout();
                return callbacks.onSignatureIssue?.(...args);
            },
            onError: (err) => {
                callbacks.onError?.(err);
                gotErr = err;
                heartbeat.pauseTimeout();
            },
            onNetworkError: (err) => {
                callbacks.onNetworkError?.(err);
                heartbeat.pauseTimeout();
            },
            onScanIssue: async (...args) => {
                heartbeat.pauseTimeout();
                return callbacks.onScanIssue?.(...args);
            },
            onContainsDocument: async (...args) => {
                heartbeat.pauseTimeout();
                return callbacks.onContainsDocument?.(...args);
            },
            onFinish: (...args) => {
                callbacks.onFinish?.(...args);
                heartbeat.pauseTimeout();
            },
            getChildren: (...args) => {
                heartbeat.refreshTimeout();
                return callbacks.getChildren(...args);
            },
            getBlocks: (...args) => {
                heartbeat.refreshTimeout();
                return callbacks.getBlocks(...args);
            },
            getKeys: (...args) => {
                heartbeat.refreshTimeout();
                return callbacks.getKeys(...args);
            },
            scanFilesHash: async (...args) => {
                heartbeat.refreshTimeout();
                return callbacks.scanFilesHash?.(...args);
            },
        },
        log,
        isNewFolderTreeAlgorithmEnabled,
        api,
        options
    );

    heartbeat.onTimeout = () => {
        // TODO: At this moment we send this to Sentry only. Metric must be used here.
        gotErr = new Error('Transfer got stuck');
        controls.cancel();
    };

    return {
        start: async () => {
            const stream = controls.start();
            const size = await sizePromise.get().catch(() => undefined);
            await fileSaver
                .saveAsFile(
                    stream,
                    {
                        filename: name,
                        mimeType: links.length === 1 ? links[0].mimeType : SupportedMimeTypes.zip,
                        size,
                    },
                    log
                )
                .catch((err) => {
                    callbacks.onError?.(err);
                    controls.cancel();
                    throw err;
                });
            if (gotErr) {
                throw gotErr;
            }
            callbacks.onFinish?.();
            heartbeat.pauseTimeout();
        },
        pause: () => {
            controls.pause();
            heartbeat.pauseTimeout();
        },
        resume: () => {
            controls.resume();
            heartbeat.refreshTimeout();
        },
        cancel: () => {
            gotErr = new TransferCancel({ message: `Transfer canceled` });
            controls.cancel();
            heartbeat.pauseTimeout();
        },
    };
}

export function initDownloadStream(
    links: LinkDownload[],
    callbacks: DownloadCallbacks,
    isNewFolderTreeAlgorithmEnabled: boolean,
    api: Api
) {
    // Stream is used in direct preview. There we do not support logs just yet.
    const noLog = () => {};
    return getControls(links, callbacks, noLog, isNewFolderTreeAlgorithmEnabled, api);
}

function getControls(
    links: LinkDownload[],
    callbacks: DownloadCallbacks,
    log: LogCallback,
    isNewFolderTreeAlgorithmEnabled: boolean,
    api: Api,
    options?: { virusScan?: boolean }
): DownloadStreamControls {
    if (links.length === 1) {
        const link = links[0];
        if (link.isFile) {
            return initDownloadLinkFile(link, callbacks, log, options);
        }
        return initDownloadLinkFolder(link, callbacks, log, isNewFolderTreeAlgorithmEnabled, api, options);
    }
    return initDownloadLinks(links, callbacks, log, isNewFolderTreeAlgorithmEnabled, api, options);
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

// TODO: This heartbeat is good enough, but has few limitations that
// must be improved next time:
// * It is hooked to available callbacks, but it doesnt get heartbeat
//   even if some operation is ongoing but takes time. For example,
//   children loading. For this reason the timeout must be very huge.
// * It must take care of possible race condition and thus ignore
//   some heartbeats that is configured by constant.
// * It is calling setTimeout too often and in various frequency instead
//   of real heartbeat.
// Ideally, we don't expand this functionality, as that requires several
// changes, while we need to refactor download fully to run in web worker.
// Then, we can apply the same heartbeat implementation as for upload.
class HeartbeatTimeout {
    private heartbeatTimeout: NodeJS.Timeout | undefined;

    private lastUpdate: number | undefined;

    private log: LogCallback;

    onTimeout: (() => void) | undefined;

    constructor(log: LogCallback) {
        this.log = log;
    }

    refreshTimeout() {
        // Do not re-create setTimeout too often and avoid refreshing right
        // after pausing (pause sends signal to pause, but onProgress can
        // still be called).
        if (this.lastUpdate && Date.now() - this.lastUpdate < HEARTBEAT_MAX_REFRESH_TIME) {
            return;
        }

        this.clearTimeout();

        this.lastUpdate = Date.now();
        this.log('Heartbeat refreshed');

        this.heartbeatTimeout = setTimeout(() => {
            this.log('Heartbeat timeouted');
            this.onTimeout?.();
        }, HEARTBEAT_WAIT_TIME);
    }

    pauseTimeout() {
        if (this.heartbeatTimeout) {
            this.lastUpdate = Date.now();
            this.log('Heartbeat paused');
            this.clearTimeout();
        }
    }

    private clearTimeout() {
        if (this.heartbeatTimeout) {
            clearTimeout(this.heartbeatTimeout);
            this.heartbeatTimeout = undefined;
        }
    }
}
