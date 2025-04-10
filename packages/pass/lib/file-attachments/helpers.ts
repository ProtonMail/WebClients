import { decodeUtf8Base64, encodeUtf8Base64 } from '@proton/crypto/lib/utils';
import { PassCrypto } from '@proton/pass/lib/crypto';
import { decodeFileMetadata } from '@proton/pass/lib/file-attachments/file-proto.transformer';
import type {
    FileAttachmentValues,
    FileDescriptor,
    ItemFileOutput,
    ItemKey,
    Maybe,
    MaybeNull,
} from '@proton/pass/types';
import { truthy } from '@proton/pass/utils/fp/predicates';
import { logger } from '@proton/pass/utils/logger';

export const isFileForRevision = (revision: number) => (file: FileDescriptor) =>
    revision >= file.revisionAdded && (!file.revisionRemoved || revision < file.revisionRemoved);

const intoFileDescriptor =
    (decryptMetadata: (file: ItemFileOutput) => Promise<Uint8Array>) =>
    async (file: ItemFileOutput): Promise<Maybe<FileDescriptor>> => {
        try {
            const descriptor = decodeFileMetadata(await decryptMetadata(file));

            return {
                ...descriptor,
                fileID: file.FileID,
                size: file.Size,
                chunks: file.Chunks,
                revisionAdded: file.RevisionAdded,
                revisionRemoved: file.RevisionRemoved ?? null,
                fileUID: file.PersistentFileUID,
                encryptionVersion: file.EncryptionVersion ?? 1,
            };
        } catch (err) {
            logger.warn('File metadata could not be opened', err);
        }
    };

const openFileDescriptors =
    (decryptMetadata: (file: ItemFileOutput) => Promise<Uint8Array>) =>
    async (files: ItemFileOutput[]): Promise<FileDescriptor[]> =>
        (await Promise.all(files.map(intoFileDescriptor(decryptMetadata)))).filter(truthy);

export const intoFileDescriptors = async (shareId: string, files: ItemFileOutput[], itemKey: ItemKey) =>
    openFileDescriptors((file) => PassCrypto.openFileDescriptor({ file, itemKey, shareId }))(files);

export const intoPublicFileDescriptors = async (files: ItemFileOutput[], itemKey: string, linkKey: string) =>
    openFileDescriptors((file) =>
        PassCrypto.openSecureLinkFileDescriptor({
            encryptedFileKey: file.FileKey,
            encryptedItemKey: itemKey,
            encryptedMetadata: file.Metadata,
            encryptionVersion: file.EncryptionVersion ?? 1,
            fileID: file.FileID,
            linkKey,
        })
    )(files);

export const filesFormInitializer = ({
    toAdd = [],
    toRemove = [],
    toRestore = [],
}: Partial<FileAttachmentValues['files']> = {}) => ({
    toAdd,
    toRemove,
    toRestore,
});

const FILE_RE = /(.*)(\.[^.]+$)/;

export const getFileParts = (filename: string): MaybeNull<{ name: string; ext: string }> => {
    const match = filename.match(FILE_RE);
    if (!match) return null;

    return { name: match[1], ext: match[2] };
};

export const reconcileFilename = (next: string, original: string): string => {
    const sanitized = next.startsWith('.') ? `file${next.trim()}` : next.trim();

    /* If new file has extension, do nothing */
    const hasExtension = FILE_RE.test(sanitized);
    if (hasExtension) return sanitized;

    /* If new file has no extension, try to use the previous one */
    const parts = getFileParts(original);
    if (parts) return sanitized + parts.ext;

    return sanitized; /* Fallback, set file name with no extension */
};

export const getExportFileName = (file: FileDescriptor): string => {
    const parts = getFileParts(file.name);
    if (parts) return `${parts.name}.${file.fileUID}${parts.ext}`;
    return `${file.name}.${file.fileUID}`;
};

/** Safari extensions require `application/octet-stream`
 * to trigger a download from an extension page. */
export const mimetypeForDownload = (mimeType: string) => {
    if (BUILD_TARGET === 'safari') return 'application/octet-stream';
    return mimeType;
};

export type FileParam = { file: string };
export type FileRef = { filename: string; mimeType: string; ref: string };

export const intoFileParam = (fileRef: FileRef): string => encodeUtf8Base64(JSON.stringify(fileRef));
export const intoFileRef = (param: string): FileRef => JSON.parse(decodeUtf8Base64(param));
