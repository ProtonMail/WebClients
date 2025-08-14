import { MEMORY_DOWNLOAD_LIMIT } from '@proton/shared/lib/drive/constants';
import { isMobile } from '@proton/shared/lib/helpers/browser';
import { getCookie } from '@proton/shared/lib/helpers/cookies';
import downloadFile from '@proton/shared/lib/helpers/downloadFile';
import { promiseWithTimeout } from '@proton/shared/lib/helpers/promise';

import type { TransferMeta } from '../../../components/TransferManager/transfer';
import { TransferCancel } from '../../../components/TransferManager/transfer';
import { sendErrorReport } from '../../../utils/errorHandling';
import { EnrichedError } from '../../../utils/errorHandling/EnrichedError';
import { isValidationError } from '../../../utils/errorHandling/ValidationError';
import { streamToBuffer } from '../../../utils/stream';
import { isTransferCancelError } from '../../../utils/transfer';
import { unleashVanillaStore } from '../../../zustand/unleash/unleash.store';
import type { LogCallback } from '../interface';
import { initDownloadSW, isOPFSSupported, isServiceWorkersSupported, openDownloadStream } from './download';

const DOWNLOAD_SW_INIT_TIMEOUT = 15 * 1000;
const MB = 1024 * 1024;
const getMemoryLimit = () => {
    const treatment = unleashVanillaStore.getState().getVariant('DriveWebDownloadMechanismParameters');
    if (treatment.enabled) {
        if (treatment.name === 'low-memory') {
            return (isMobile() ? 100 : 250) * MB;
        }
        if (treatment.name === 'base-memory') {
            return (isMobile() ? 100 : 750) * MB;
        }
        if (treatment.name === 'high-memory') {
            return (isMobile() ? 100 : 1000) * MB;
        }
    }
    // Default limit for in-memory downloads is 500MB for Desktop and 100MB on Mobile as per MEMORY_DOWNLOAD_LIMIT
    return MEMORY_DOWNLOAD_LIMIT;
};

const hasEnoughOPFSStorage = async (size?: number): Promise<boolean> => {
    if (size && typeof navigator.storage !== 'undefined' && typeof navigator.storage.estimate !== 'undefined') {
        // https://developer.mozilla.org/en-US/docs/Web/API/StorageManager/estimate
        const estimate = await navigator.storage.estimate();
        const available = (estimate.quota || 0) - (estimate.usage || 0);
        // We verify the estimates can hold up to twice the size of the file
        // Moving a file from OPFS to user FS is like making a copy so must holds the file twice
        return available > size * 2;
    }
    return false;
};

const getRemovalTimeout = (size?: number): number => {
    if (size) {
        // To be really safe, we account for 1 second (1000ms) to each 30MB of file
        // This is extra, extra, extra, extra safe
        // A move should normally takes a very few seconds maximum
        const timeout = (size / (30 * MB)) * 1000;
        return Math.max(500, timeout); // Ensure minimum timeout of 500ms
    }
    return 4e4; // 40 seconds, same default as the file-saver package we use https://github.com/eligrey/FileSaver.js/blob/master/src/FileSaver.js#L106
};

// FileSaver provides functionality to start download to file. This class does
// not deal with API or anything else. Files which fit the memory (see
// MEMORY_DOWNLOAD_LIMIT constant) are buffered in browser and then saved in
// one go. Bigger files are streamed and user can see the progress almost like
// it would be normal file. See saveViaDownload for more info.
export class FileSaver {
    useSWFallback: boolean = false;

    private useBlobFallback: boolean = false;

    private isSWReady: boolean = false;

    async selectMechanismForDownload(size?: number): Promise<'memory' | 'opfs' | 'sw' | 'memory_fallback'> {
        /** For E2E usage we need to enforce a certain mechanism and test all mechanism without any limits */
        const cookie = getCookie('DriveE2EDownloadMechanism');
        if (cookie && ['memory', 'opfs', 'sw'].includes(cookie)) {
            return cookie as 'memory' | 'opfs' | 'sw';
        }

        const limit = getMemoryLimit();
        if (size && size < limit) {
            return 'memory';
        }

        // https://developer.mozilla.org/en-US/docs/Web/API/File_System_API/Origin_private_file_system
        if ((await isOPFSSupported()) && this.useSWFallback === false && (await hasEnoughOPFSStorage(size))) {
            return 'opfs';
        }

        if (isServiceWorkersSupported()) {
            return 'sw';
        }

        this.useBlobFallback = true;
        return 'memory_fallback';
    }

    // saveViaDownload uses service workers to download file without need to
    // buffer the whole content in memory and open the download in browser as
    // is done for regular files. To do this, using service worker is used
    // local new address where is streamed the download and that address is
    // opened as hidden iframe in the main page to start download in browser.
    // To have this working, service workers and option to return stream as
    // the response is needed, which is not supported by all browsers. See
    // isUnsupported in download.ts for more info. When the support is missing,
    // it falls back to buffered download.
    // Ideally, once we update to openpgpjs v5 with custom web workers, would
    // be great if we could merge this to the same worker (but note the
    // difference between web and service worker) to reduce data exchanges.
    private async saveViaDownload(stream: ReadableStream<Uint8Array>, meta: TransferMeta, log: LogCallback) {
        if (!this.isSWReady) {
            // Always wait for Service Worker initialization to complete
            try {
                await promiseWithTimeout({
                    timeoutMs: DOWNLOAD_SW_INIT_TIMEOUT,
                    promise: initDownloadSW(),
                });
            } catch (error: unknown) {
                this.useBlobFallback = true;
                if (error instanceof Error) {
                    console.warn('Saving file will fallback to in-memory downloads:', error.message);
                    log(`Service worker fail reason: ${error.message}`);
                } else {
                    log(`Service worker throw not an Error: ${typeof error} ${String(error)}`);
                }
            } finally {
                this.isSWReady = true;
            }
        }

        if (this.useBlobFallback) {
            return this.saveViaBuffer(stream, meta, log);
        }

        log('Saving via service worker');

        try {
            const abortController = new AbortController();
            const saveStream = await openDownloadStream(meta, { onCancel: () => abortController.abort() });
            await new Promise((resolve, reject) => {
                abortController.signal.addEventListener('abort', () => {
                    reject(new TransferCancel({ message: `Transfer canceled` }));
                });
                stream.pipeTo(saveStream, { preventCancel: true }).then(resolve).catch(reject);
            });
        } catch (err: any) {
            log(`Save via download failed. Reason: ${err.message}`);
            throw err;
        }
    }

    private async saveViaOPFS(stream: ReadableStream<Uint8Array>, meta: TransferMeta, log: LogCallback) {
        if (this.useSWFallback) {
            return this.saveViaDownload(stream, meta, log);
        }

        log('Saving via OPFS');
        let root: FileSystemDirectoryHandle | undefined;
        try {
            let fileHandle: FileSystemFileHandle;
            let writable: FileSystemWritableFileStream;
            try {
                root = await navigator.storage.getDirectory();
                // Create or open the file in the OPFS
                fileHandle = await root.getFileHandle(meta.filename, { create: true });
                // Create a writable stream to the file
                writable = await fileHandle.createWritable();
            } catch (e: unknown) {
                log(`Failed to initiate OPFS: ${e instanceof Error ? e.message : String(e)}`);
                log('Fallback to SW download');
                this.useSWFallback = true;
                return await this.saveViaDownload(stream, meta, log);
            }

            // Manually read from the incoming stream and write to the OPFS file
            const reader = stream.getReader();
            try {
                while (true) {
                    const { done, value } = await reader.read();
                    if (done) {
                        break;
                    }
                    await writable.write(value);
                }
            } finally {
                // Make sure to close the writer and release the reader
                await writable.close();
                reader.releaseLock();
            }

            // Retrieve the written file as a File object
            const file = await fileHandle.getFile();
            downloadFile(file, meta.filename);
            log('File saved to OPFS and download triggered successfully');

            // We need to remove the file entry after the blob is moved
            // This operation usually takes a very few seconds but to be super safe we will account for 1 sec for each 30MB
            const timeout = getRemovalTimeout(meta.size);
            const removeEntry = async () => {
                try {
                    if (root) {
                        await root.removeEntry(meta.filename);
                        log('File removed from OPFS successfully');
                    }
                } catch (e) {
                    sendErrorReport(e);
                } finally {
                    window.removeEventListener('beforeunload', removeEntry);
                }
            };
            window.addEventListener('beforeunload', removeEntry);
            setTimeout(removeEntry, timeout);
        } catch (err: any) {
            if (root) {
                await root.removeEntry(meta.filename);
            }
            log(`Save via OPFS failed. Reason: ${err.message}`);
            throw err;
        }
    }

    // saveViaBuffer reads the stream and downloads the file in one go.
    // eslint-disable-next-line class-methods-use-this
    private async saveViaBuffer(stream: ReadableStream<Uint8Array>, meta: TransferMeta, log: LogCallback) {
        log('Saving via buffer');
        try {
            const chunks = await streamToBuffer(stream);
            downloadFile(new Blob(chunks, { type: meta.mimeType }), meta.filename);
        } catch (err: any) {
            log(`Save via buffer failed. Reason: ${err.message}`);
            if (!isTransferCancelError(err)) {
                if (isValidationError(err)) {
                    throw err;
                }

                if (err instanceof EnrichedError) {
                    throw err;
                }

                throw new EnrichedError(`Download failed: ${err.message || err}`, {
                    extra: { err },
                });
            }
        }
    }

    async saveAsFile(stream: ReadableStream<Uint8Array>, meta: TransferMeta, log: LogCallback) {
        const mechanism = await this.selectMechanismForDownload(meta.size);

        log(`Saving file. meta size: ${meta.size}, mechanism: ${mechanism}`);

        if (mechanism === 'memory' || mechanism === 'memory_fallback') {
            return this.saveViaBuffer(stream, meta, log);
        }

        if (mechanism === 'opfs') {
            return this.saveViaOPFS(stream, meta, log);
        }

        return this.saveViaDownload(stream, meta, log);
    }

    async wouldExceeedMemoryLImit(size: number): Promise<boolean> {
        const mechanism = await this.selectMechanismForDownload(size);
        return mechanism === 'memory_fallback' && size > getMemoryLimit();
    }
}

const fileSaverSingleton = {
    _instance: undefined as FileSaver | undefined,
    get instance() {
        if (!this._instance) {
            this._instance = new FileSaver();
        }
        return this._instance;
    },
};

export default fileSaverSingleton;
