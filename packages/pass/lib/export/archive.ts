import type { InputWithSizeMeta, InputWithoutMeta } from 'client-zip';

import { encryptPassExport } from '@proton/pass/lib/crypto/utils/export';
import { resolveItemKey } from '@proton/pass/lib/crypto/utils/helpers';
import { createDownloadStream } from '@proton/pass/lib/file-attachments/download';
import { downloadFileChunk, resolveItemFiles } from '@proton/pass/lib/file-attachments/file-attachments.requests';
import { getExportFileName, intoFileDescriptors, isFileForRevision } from '@proton/pass/lib/file-attachments/helpers';
import type { ExportThunk } from '@proton/pass/store/selectors';
import type { FileDescriptor, IndexedByShareIdAndItemId, ItemRevision } from '@proton/pass/types';
import { prop } from '@proton/pass/utils/fp/lens';
import { getEpoch } from '@proton/pass/utils/time/epoch';
import { PASS_APP_NAME } from '@proton/shared/lib/constants';

export type ExportFileStream = InputWithoutMeta | InputWithSizeMeta;
export type ExportGenerator = AsyncGenerator<ExportFileStream>;

export const archivePath = (filename: string, subpath?: string) => {
    if (!subpath) return `${PASS_APP_NAME}/${filename}`;
    return `${PASS_APP_NAME}/${subpath}/${filename.replace(/[\/\\]/g, '_')}`;
};

export const getArchiveName = (format: string) => {
    const timestamp = new Date().toISOString().split('T')[0];
    return `${PASS_APP_NAME}_export_${timestamp}_${getEpoch()}.${format}`;
};

export async function* createExportAttachmentsStream(
    items: ItemRevision[],
    signal: AbortSignal,
    onFileDownloaded: (file: FileDescriptor, item: ItemRevision, itemFilesCount: number) => void
): ExportGenerator {
    for (const item of items) {
        const { shareId, itemId, revision } = item;

        if (signal.aborted) throw new DOMException('Export aborted', 'AbortError');

        const result = await resolveItemFiles(item);
        const itemKey = await resolveItemKey(item.shareId, item.itemId);
        const itemFiles = await intoFileDescriptors(shareId, result, itemKey);

        /** Only export files that match the latest item revision */
        const files = itemFiles.filter(isFileForRevision(revision));

        for (const file of files) {
            const { fileID, chunks } = file;
            const chunkIDs = chunks.map(prop('ChunkID'));

            const downloadStream = createDownloadStream(
                { shareId, fileID, chunkIDs, encryptionVersion: file.encryptionVersion },
                (chunkID: string) => downloadFileChunk({ shareId, itemId, fileID, chunkID }, signal),
                signal
            );

            yield {
                name: archivePath(getExportFileName(shareId)(file), 'files'),
                input: downloadStream,
                size: file.size,
            } satisfies ExportFileStream;

            onFileDownloaded(file, item, files.length);
        }
    }
}

export async function* createExportDataStream(
    thunk: ExportThunk,
    options: {
        files: IndexedByShareIdAndItemId<FileDescriptor[]>;
        encrypted: boolean;
        passphrase?: string;
    }
): ExportGenerator {
    const exportData = thunk(options.files);
    const json = JSON.stringify(exportData);

    const data = await (() => {
        if (!(options.encrypted && options.passphrase)) return json;
        const encoder = new TextEncoder();
        const buffer = encoder.encode(json);
        return encryptPassExport(buffer, options.passphrase);
    })();

    yield {
        name: archivePath(options.encrypted ? 'data.pgp' : 'data.json'),
        input: new Blob([data], { type: options.encrypted ? 'application/pgp-encrypted' : 'application/json' }),
        lastModified: new Date(),
    };
}

/** `makeZip` will create an un-compressed archive */
export const createArchive = async (streams: ExportGenerator[], signal: AbortSignal) => {
    const { makeZip } = await import(/* webpackChunkName: "zip" */ 'client-zip');

    return makeZip(
        (async function* () {
            try {
                for (const stream of streams) yield* stream;
            } catch (err) {
                /** If the signal is aborted, this stream will have
                 * already gracefully closed as such we can no-op
                 * error reporting to avoid unhandled rejections */
                if (!signal.aborted) throw err;
            }
        })(),
        { buffersAreUTF8: true }
    );
};
