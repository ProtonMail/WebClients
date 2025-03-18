import { decodeFileMetadata } from '@proton/pass/lib/file-attachments/file-proto.transformer';
import type {
    FileAttachmentValues,
    FileDescriptor,
    ItemFileOutput,
    Maybe,
    SelectedItem,
    ShareId,
} from '@proton/pass/types';
import { truthy } from '@proton/pass/utils/fp/predicates';

export const intoFileDescriptor = async (
    files: ItemFileOutput[],
    decryptDescriptor: (file: ItemFileOutput) => Promise<Uint8Array>
): Promise<FileDescriptor[]> =>
    (
        await Promise.all(
            files.map<Promise<Maybe<FileDescriptor>>>(async (file) => {
                try {
                    const descriptor = decodeFileMetadata(await decryptDescriptor(file)) ?? {
                        name: 'Unknown',
                        mimeType: '',
                    };

                    return {
                        ...descriptor,
                        fileID: file.FileID,
                        size: file.Size,
                        chunks: file.Chunks,
                        revisionAdded: file.RevisionAdded,
                        revisionRemoved: file.RevisionRemoved ?? null,
                        fileUID: file.PersistentFileUID,
                    };
                } catch (err) {
                    console.warn(err, file);
                }
            })
        )
    ).filter(truthy);

export const flattenFilesByItemShare = <T = FileDescriptor>(
    files: Record<ShareId, Maybe<Record<string, T[]>>>
): ({ files: T[] } & SelectedItem)[] =>
    Object.entries(files).flatMap(([shareId, items]) =>
        Object.entries(items ?? {}).map(([itemId, files]) => ({
            shareId,
            itemId,
            files,
        }))
    );

export const filesFormInitializer = ({
    toAdd = [],
    toRemove = [],
    toRestore = [],
}: Partial<FileAttachmentValues['files']> = {}) => ({
    toAdd,
    toRemove,
    toRestore,
});

export const reconcileFilename = (renamedFile: string, fileName: string): string => {
    const extensionRegex = /\.[^/.]+$/;

    /* If new file has extension, do nothing */
    const hasExtension = extensionRegex.test(renamedFile);
    if (hasExtension) return renamedFile;

    /* If new file has no extension, try to use the previous one */
    const [previousExtension] = fileName.match(extensionRegex) ?? [];
    if (previousExtension) return renamedFile + previousExtension;

    /* Fallback, set file name with no extension */
    return renamedFile;
};
