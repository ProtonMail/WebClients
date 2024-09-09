import type { ReadableStream } from 'web-streams-polyfill';

import { MEMORY_DOWNLOAD_LIMIT } from '@proton/shared/lib/drive/constants';
import downloadFile from '@proton/shared/lib/helpers/downloadFile';

import type { TransferMeta } from '../../../components/TransferManager/transfer';
import { TransferCancel } from '../../../components/TransferManager/transfer';
import { EnrichedError } from '../../../utils/errorHandling/EnrichedError';
import { isValidationError } from '../../../utils/errorHandling/ValidationError';
import { streamToBuffer } from '../../../utils/stream';
import { isTransferCancelError } from '../../../utils/transfer';
import type { LogCallback } from '../interface';
import { initDownloadSW, openDownloadStream } from './download';

// FileSaver provides functionality to start download to file. This class does
// not deal with API or anything else. Files which fit the memory (see
// MEMORY_DOWNLOAD_LIMIT constant) are buffered in browser and then saved in
// one go. Bigger files are streamed and user can see the progress almost like
// it would be normal file. See saveViaDownload for more info.
class FileSaver {
    private useBlobFallback = false;

    private swFailReason?: string;

    constructor() {
        initDownloadSW().catch((error) => {
            this.useBlobFallback = true;
            console.warn('Saving file will fallback to in-memory downloads:', error.message);
            this.swFailReason = error.message;
        });
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
        log(
            `Saving file. meta size: ${meta.size}, memory limit: ${MEMORY_DOWNLOAD_LIMIT}, will use blob fallback: ${this.useBlobFallback}`
        );
        if (this.swFailReason) {
            log(`Service worker fail reason: ${this.swFailReason}`);
        }
        if (meta.size && meta.size < MEMORY_DOWNLOAD_LIMIT) {
            return this.saveViaBuffer(stream, meta, log);
        }
        return this.saveViaDownload(stream, meta, log);
    }

    isFileTooBig(size: number) {
        return this.useBlobFallback && size > MEMORY_DOWNLOAD_LIMIT;
    }
}

export default new FileSaver();
