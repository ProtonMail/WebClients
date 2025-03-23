import { type InputWithSizeMeta, type InputWithoutMeta, makeZip } from 'client-zip';

import { encryptPassExport } from '@proton/pass/lib/crypto/utils/export';
import { createDownloadStream } from '@proton/pass/lib/file-attachments/download';
import { downloadFileChunk, resolveItemFiles } from '@proton/pass/lib/file-attachments/file-attachments.requests';
import { getExportFileName, intoFileDescriptors, isFileForRevision } from '@proton/pass/lib/file-attachments/helpers';
import { getLatestItemKey } from '@proton/pass/lib/items/item.requests';
import type { ExportThunk } from '@proton/pass/store/selectors';
import type { FileDescriptor, IndexedByShareIdAndItemId, ItemRevision } from '@proton/pass/types';
import { prop } from '@proton/pass/utils/fp/lens';
import { PASS_APP_NAME } from '@proton/shared/lib/constants';

export type ExportFileStream = InputWithoutMeta | InputWithSizeMeta;
export type ExportGenerator = AsyncGenerator<ExportFileStream>;

export const archivePath = (filename: string, subpath?: string) => {
    if (!subpath) return `${PASS_APP_NAME}/${filename}`;
    return `${PASS_APP_NAME}/${subpath}/${filename.replace(/[\/\\]/g, '_')}`;
};

export const getArchiveName = (format: string) => {
    const timestamp = new Date().toISOString().split('T')[0];
    return `${PASS_APP_NAME}_export_${timestamp}.${format}`;
};

export async function* createExportAttachmentsStream(
    items: ItemRevision[],
    onFileDownloaded: (file: FileDescriptor, item: ItemRevision, itemFilesCount: number) => void
): ExportGenerator {
    for (const item of items) {
        const { shareId, itemId, revision } = item;

        const result = await resolveItemFiles(item);
        const latestItemKey = await getLatestItemKey(item);
        const itemFiles = await intoFileDescriptors(result, shareId, latestItemKey);

        /** Only export files that match the latest item revision */
        const files = itemFiles.filter(isFileForRevision(revision));

        for (const file of files) {
            const { fileID, chunks } = file;
            const chunkIDs = chunks.map(prop('ChunkID'));
            const downloadStream = createDownloadStream(fileID, chunkIDs, (chunkID) =>
                downloadFileChunk({ shareId, itemId, fileID, chunkID })
            );

            yield {
                name: archivePath(getExportFileName(file), 'files'),
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
export const createArchive = (streams: ExportGenerator[]) => {
    return makeZip(
        (async function* () {
            for (const stream of streams) {
                yield* stream;
            }
        })(),
        { buffersAreUTF8: true }
    );
};
