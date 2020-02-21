import { openDownloadStream, initDownloadSW } from './download';
import { TransferMeta } from '../../interfaces/transfer';
import { streamToBuffer } from '../stream';
import downloadFile from 'proton-shared/lib/helpers/downloadFile';
import { ReadableStream } from 'web-streams-polyfill';

class FileSaver {
    private useBlobFallback = false;

    constructor() {
        initDownloadSW().catch((error) => {
            this.useBlobFallback = true;
            console.error('Saving file will fallback to in-memory downloads:', error.message);
        });
    }

    async saveViaDownload(stream: ReadableStream<Uint8Array>, meta: TransferMeta) {
        if (this.useBlobFallback) {
            return this.saveViaBuffer(stream, meta);
        }

        try {
            const saveStream = await openDownloadStream(meta, { onCancel: () => stream.cancel('user canceled') });
            return stream.pipeTo(saveStream, { preventCancel: true });
        } catch (err) {
            console.error('Failed to save file via download, falling back to in-memory download:', err);
            return this.saveViaBuffer(stream, meta);
        }
    }

    async saveViaBuffer(stream: ReadableStream<Uint8Array>, meta: TransferMeta) {
        const chunks = await streamToBuffer(stream);
        downloadFile(new Blob(chunks, { type: 'application/octet-stream; charset=utf-8' }), meta.filename);
    }
}

export default new FileSaver();
