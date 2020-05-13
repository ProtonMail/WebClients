import { ReadableStream } from 'web-streams-polyfill';
import { Writer as ZipWriter } from '@transcend-io/conflux';
import { lookup } from 'mime-types';
import downloadFile from 'proton-shared/lib/helpers/downloadFile';
import { openDownloadStream, initDownloadSW } from './download';
import { TransferMeta } from '../../interfaces/transfer';
import { streamToBuffer } from '../stream';
import { NestedFileStream } from '../../interfaces/file';

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

    async saveViaBuffer(stream: ReadableStream<Uint8Array>, filename: string) {
        try {
            const chunks = await streamToBuffer(stream);
            downloadFile(new Blob(chunks, { type: 'application/octet-stream; charset=utf-8' }), filename);
        } catch (err) {
            if (err.name !== 'TransferCancel' && err.name !== 'AbortError') {
                throw err;
            }
        }
    }

    async saveViaZip(filename: string) {
        try {
            const abortController = new AbortController();
            const { readable, writable } = new ZipWriter();
            const writer = writable.getWriter();

            const files: NestedFileStream[] = [];

            if (this.useBlobFallback) {
                this.saveViaBuffer(readable, filename);
            } else {
                const mimeType = lookup(filename) || undefined;
                const zipMeta = { filename, mimeType };

                const saveStream = await openDownloadStream(zipMeta, {
                    onCancel: () => {
                        files.forEach(({ stream }) => stream.cancel('user canceled'));
                    },
                    abortSignal: abortController.signal
                });

                // This creates it's own streams that are not aborted, hence the abort signal
                readable.pipeTo(saveStream);
            }

            return {
                addFile: (file: NestedFileStream) => {
                    writer.write({
                        name: file.path,
                        lastModified: new Date(),
                        stream: () => file.stream
                    });
                    files.push(file);
                },
                addFolder: (path: string) => {
                    writer.write({
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
        } catch (err) {
            if (err.name !== 'TransferCancel' && err.name !== 'AbortError') {
                throw err;
            }
            return undefined;
        }
    }
}

export default new FileSaver();
