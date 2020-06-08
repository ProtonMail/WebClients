import { ReadableStream } from 'web-streams-polyfill';
import { Writer as ZipWriter } from '@transcend-io/conflux';
import { lookup } from 'mime-types';
import downloadFile from 'proton-shared/lib/helpers/downloadFile';
import { openDownloadStream, initDownloadSW } from './download';
import { TransferMeta } from '../../interfaces/transfer';
import { streamToBuffer } from '../stream';
import { NestedFileStream } from '../../interfaces/file';
import { MEMORY_DOWNLOAD_LIMIT } from '../../constants';

class FileSaver {
    private useBlobFallback = false;

    constructor() {
        initDownloadSW().catch((error) => {
            this.useBlobFallback = true;
            console.error('Saving file will fallback to in-memory downloads:', error.message);
        });
    }

    private async saveViaDownload(stream: ReadableStream<Uint8Array>, meta: TransferMeta) {
        if (this.useBlobFallback) {
            return this.saveViaBuffer(stream, meta.filename);
        }

        try {
            const saveStream = await openDownloadStream(meta, { onCancel: () => stream.cancel('user canceled') });
            await stream.pipeTo(saveStream, { preventCancel: true });
        } catch (err) {
            if (err.name !== 'TransferCancel' && err.name !== 'AbortError') {
                console.error('Failed to save file via download, falling back to in-memory download:', err);
                await this.saveViaBuffer(stream, meta.filename);
            }
        }
    }

    private async saveViaBuffer(stream: ReadableStream<Uint8Array>, filename: string) {
        try {
            const chunks = await streamToBuffer(stream);
            downloadFile(new Blob(chunks, { type: 'application/octet-stream; charset=utf-8' }), filename);
        } catch (err) {
            if (err.name !== 'TransferCancel' && err.name !== 'AbortError') {
                console.error(`File download for ${filename} failed: ${err}`);
            }
        }
    }

    async saveAsFile(stream: ReadableStream<Uint8Array>, meta: TransferMeta) {
        if (meta.size && meta.size < MEMORY_DOWNLOAD_LIMIT) {
            return this.saveViaBuffer(stream, meta.filename);
        }
        return this.saveViaDownload(stream, meta);
    }

    async saveAsZip(name: string) {
        const filename = `${name}.zip`;
        const files: NestedFileStream[] = [];

        const abortController = new AbortController();
        const { readable, writable } = new ZipWriter();
        const writer = writable.getWriter();

        if (this.useBlobFallback) {
            this.saveViaBuffer(readable, filename);
        } else {
            try {
                const mimeType = lookup(filename) || undefined;
                const zipMeta = { filename, mimeType };

                const saveStream = await openDownloadStream(zipMeta, {
                    onCancel: () => {
                        files.forEach(({ stream }) => stream.cancel('user canceled'));
                    },
                    abortSignal: abortController.signal
                });

                // ZipWriter creates it's own streams that are not aborted, using abort signal to force cancel manually
                readable.pipeTo(saveStream);
            } catch (err) {
                console.error('Failed to save zip via download, falling back to in-memory download:', err);
                this.saveViaBuffer(readable, filename);
            }
        }

        return {
            addFile: async (file: NestedFileStream) => {
                files.push(file);
                await writer.write({
                    name: file.path,
                    lastModified: new Date(),
                    stream: () => file.stream
                });
            },
            addFolder: async (path: string) => {
                await writer.write({
                    directory: true,
                    name: path
                });
            },
            close: () => {
                writer.close();
            },
            abort: async (reason: any) => {
                abortController.abort();
                writer.abort(reason);
            }
        };
    }
}

export default new FileSaver();
