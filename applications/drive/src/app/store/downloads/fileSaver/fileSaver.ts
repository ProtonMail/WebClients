import { ReadableStream } from 'web-streams-polyfill';

import downloadFile from '@proton/shared/lib/helpers/downloadFile';
import { TransferMeta } from '@proton/shared/lib/interfaces/drive/transfer';
import { MEMORY_DOWNLOAD_LIMIT } from '@proton/shared/lib/drive/constants';

import { streamToBuffer } from '../../../utils/stream';
import { isTransferCancelError } from '../../../utils/transfer';
import { openDownloadStream, initDownloadSW } from './download';

// FileSaver provides functionality to start download to file. This class does
// not deal with API or anything else. Files which fit the memory (see
// MEMORY_DOWNLOAD_LIMIT constant) are buffered in browser and then saved in
// one go. Bigger files are streamed and user can see the progress almost like
// it would be normal file. See saveViaDownload for more info.
class FileSaver {
    private useBlobFallback = false;

    constructor() {
        initDownloadSW().catch((error) => {
            this.useBlobFallback = true;
            console.warn('Saving file will fallback to in-memory downloads:', error.message);
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
    private async saveViaDownload(stream: ReadableStream<Uint8Array>, meta: TransferMeta) {
        if (this.useBlobFallback) {
            return this.saveViaBuffer(stream, meta);
        }

        try {
            const saveStream = await openDownloadStream(meta, { onCancel: () => stream.cancel('user canceled') });
            await stream.pipeTo(saveStream, { preventCancel: true });
        } catch (err: any) {
            if (!isTransferCancelError(err)) {
                console.warn('Failed to save file via download, falling back to in-memory download:', err);
                await this.saveViaBuffer(stream, meta);
            }
        }
    }

    // saveViaBuffer reads the stream and downloads the file in one go.
    // eslint-disable-next-line class-methods-use-this
    private async saveViaBuffer(stream: ReadableStream<Uint8Array>, meta: TransferMeta) {
        try {
            const chunks = await streamToBuffer(stream);
            downloadFile(new Blob(chunks, { type: meta.mimeType }), meta.filename);
        } catch (err: any) {
            if (!isTransferCancelError(err)) {
                throw new Error(`File download for ${meta.filename} failed: ${err}`);
            }
        }
    }

    async saveAsFile(stream: ReadableStream<Uint8Array>, meta: TransferMeta) {
        if (meta.size && meta.size < MEMORY_DOWNLOAD_LIMIT) {
            return this.saveViaBuffer(stream, meta);
        }
        return this.saveViaDownload(stream, meta);
    }
}

export default new FileSaver();
