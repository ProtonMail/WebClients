import { ReadableStream } from 'web-streams-polyfill';
import { Writer as ZipWriter } from '@transcend-io/conflux';
import downloadFile from '@proton/shared/lib/helpers/downloadFile';
import { isWindows } from '@proton/shared/lib/helpers/browser';
import { openDownloadStream, initDownloadSW } from './download';
import { TransferMeta } from '../../interfaces/transfer';
import { streamToBuffer } from '../stream';
import { NestedFileStream } from '../../interfaces/file';
import { MEMORY_DOWNLOAD_LIMIT } from '../../constants';
import { isTransferCancelError } from '../transfer';
import { adjustName, adjustWindowsLinkName, splitLinkName } from '../link';
import { SupportedMimeTypes } from '../MimeTypeParser/constants';

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
            return this.saveViaBuffer(stream, meta);
        }

        try {
            const saveStream = await openDownloadStream(meta, { onCancel: () => stream.cancel('user canceled') });
            await stream.pipeTo(saveStream, { preventCancel: true });
        } catch (err) {
            if (!isTransferCancelError(err)) {
                console.error('Failed to save file via download, falling back to in-memory download:', err);
                await this.saveViaBuffer(stream, meta);
            }
        }
    }

    // eslint-disable-next-line class-methods-use-this
    private async saveViaBuffer(stream: ReadableStream<Uint8Array>, meta: TransferMeta) {
        try {
            const chunks = await streamToBuffer(stream);
            downloadFile(new Blob(chunks, { type: meta.mimeType }), meta.filename);
        } catch (err) {
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

    async saveAsZip(name: string) {
        const filename = name.endsWith('.zip') ? name : `${name}.zip`;
        const files: NestedFileStream[] = [];
        const folders = new Map<string, string>(); // original path : adjusted path
        const folderPaths = new Set<string>(); // unique lowercase folder paths

        const abortController = new AbortController();
        const { readable, writable } = new ZipWriter();
        const writer = writable.getWriter();

        const adjustFolderPath = (folderPath: string): string => {
            const parents = folderPath.split('/');
            const folderName = parents.pop();

            if (!folderName) {
                throw new Error(`Folder path ${folderPath} is invalid`);
            }

            const parentPath = folders.get(parents.join('/')) || '';
            const fixedName = isWindows() ? adjustWindowsLinkName(folderName) : folderName;

            const deduplicate = (index = 0): string => {
                const adjustedName = `${adjustName(index, fixedName)}/`;
                const adjustedPath = `${parentPath}${adjustedName}`;

                if (folderPaths.has(adjustedPath.toLowerCase())) {
                    return deduplicate(index + 1);
                }
                folders.set(folderPath, adjustedPath);
                return adjustedPath;
            };

            return deduplicate();
        };

        const adjustFileName = ({ fileName, parentPath }: NestedFileStream) => {
            const fixedName = isWindows() ? adjustWindowsLinkName(fileName) : fileName;
            const [namePart, extension] = splitLinkName(fixedName);

            const deduplicate = (index = 0): string => {
                const adjustedName = adjustName(index, namePart, extension);
                if (
                    files.find(
                        (file) =>
                            file.parentPath === parentPath && file.fileName.toLowerCase() === adjustedName.toLowerCase()
                    )
                ) {
                    return deduplicate(index + 1);
                }
                return adjustedName;
            };

            return deduplicate();
        };

        const mimeType = SupportedMimeTypes.zip;
        const zipMeta = { filename, mimeType };

        if (this.useBlobFallback) {
            this.saveViaBuffer(readable, zipMeta).catch(console.error);
        } else {
            try {
                const saveStream = await openDownloadStream(zipMeta, {
                    onCancel: () => {
                        files.forEach(({ stream }) => {
                            stream.cancel('user canceled').catch(console.error);
                        });
                    },
                    abortSignal: abortController.signal,
                });

                // ZipWriter creates it's own streams that are not aborted, using abort signal to force cancel manually
                readable.pipeTo(saveStream).catch(console.error);
            } catch (err) {
                console.error('Failed to save zip via download, falling back to in-memory download:', err);
                this.saveViaBuffer(readable, zipMeta).catch(console.error);
            }
        }

        return {
            addFile: async (file: NestedFileStream) => {
                const fileName = adjustFileName(file);
                const parentFolder = folders.get(file.parentPath) ?? '';
                const fullPath = `${parentFolder}${fileName}`;
                files.push({
                    ...file,
                    fileName,
                });
                await writer.write({
                    name: fullPath,
                    lastModified: new Date(),
                    stream: () => file.stream,
                });
            },
            addFolder: async (path: string) => {
                const folderPath = adjustFolderPath(path);
                folderPaths.add(folderPath.toLocaleLowerCase());
                await writer.write({
                    directory: true,
                    name: folderPath,
                });
            },
            close: () => writer.close(),
            abort: async (reason: any) => {
                abortController.abort();
                return writer.abort(reason);
            },
        };
    }
}

export default new FileSaver();
