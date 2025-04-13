import { FILE_DOWNLOAD_TIMEOUT, FILE_UPLOAD_TIMEOUT } from '@proton/pass/constants';
import { api } from '@proton/pass/lib/api/api';
import { createPageIterator } from '@proton/pass/lib/api/utils';
import { PassCrypto } from '@proton/pass/lib/crypto';
import { resolveItemKey } from '@proton/pass/lib/crypto/utils/helpers';
import { intoPublicFileDescriptors } from '@proton/pass/lib/file-attachments/helpers';
import { parseItemRevision } from '@proton/pass/lib/items/item.parser';
import type {
    CreatePendingFileRequest,
    FileDownloadChunk,
    FileDownloadPublicChunk,
    FileID,
    FileRestoreDTO,
    ItemFileOutput,
    ItemKey,
    ItemRevision,
    ItemRevisionContentsResponse,
    ItemRevisionLinkFiles,
    ItemType,
    LinkFileToItemInput,
    SecureLinkItem,
    SelectedItem,
    UniqueItem,
} from '@proton/pass/types';
import { uint8ArrayToBase64String } from '@proton/shared/lib/helpers/encoding';
import chunk from '@proton/utils/chunk';

export const createPendingFile = async (
    metadata: string,
    totalChunks: number,
    encryptionVersion: number
): Promise<string> =>
    (
        await api({
            url: `pass/v1/file`,
            data: {
                Metadata: metadata,
                ChunkCount: totalChunks,
                EncryptionVersion: encryptionVersion,
            } satisfies CreatePendingFileRequest,
            method: 'post',
        })
    ).File!.FileID;

export const uploadFileChunk = async (fileId: string, chunkIndex: number, chunkData: Blob, signal: AbortSignal) =>
    api({
        url: `pass/v1/file/${fileId}/chunk`,
        input: 'form',
        data: { ChunkIndex: chunkIndex, ChunkData: chunkData },
        output: 'raw',
        method: 'post',
        timeout: FILE_UPLOAD_TIMEOUT,
        signal,
    });

export const downloadFileChunk = async (dto: FileDownloadChunk, signal: AbortSignal): Promise<ReadableStream> =>
    api({
        url: `pass/v1/share/${dto.shareId}/item/${dto.itemId}/file/${dto.fileID}/chunk/${dto.chunkID}`,
        method: 'get',
        output: 'stream',
        headers: { 'Content-Type': 'application/octet-stream' },
        timeout: FILE_DOWNLOAD_TIMEOUT,
        signal,
    });

export const downloadPublicFileChunk = async (
    dto: FileDownloadPublicChunk,
    signal: AbortSignal
): Promise<ReadableStream> =>
    api({
        url: `pass/v1/public_link/files/${dto.filesToken}/${dto.fileID}/${dto.chunkID}`,
        method: 'get',
        output: 'stream',
        headers: { 'Content-Type': 'application/octet-stream' },
        signal,
    });

export const updatePendingFileMetadata = async (metadata: string, fileID: FileID): Promise<string> =>
    (
        await api({
            url: `pass/v1/file/${fileID}/metadata`,
            data: { Metadata: metadata },
            method: 'put',
        })
    ).File!.FileID;

export const restoreSingleFile = async (
    { shareId, itemId, fileId }: FileRestoreDTO,
    itemKey: ItemKey
): Promise<ItemFileOutput> =>
    (
        await api({
            url: `pass/v1/share/${shareId}/item/${itemId}/file/${fileId}/restore`,
            method: 'post',
            data: {
                FileKey: uint8ArrayToBase64String(
                    await PassCrypto.encryptFileKey({ fileID: fileId, itemKey, shareId, pending: false })
                ),
                ItemKeyRotation: itemKey.rotation,
            },
        })
    ).Result.File;

export const restoreRevisionFiles = async (
    dto: { toRestore: FileID[]; itemKey: ItemKey } & SelectedItem
): Promise<ItemRevisionContentsResponse> =>
    (
        await api({
            url: `pass/v1/share/${dto.shareId}/item/${dto.itemId}/file/restore`,
            method: 'post',
            data: {
                FilesToRestore: await Promise.all(
                    dto.toRestore.map(async (fileID) => ({
                        FileID: fileID,
                        FileKey: uint8ArrayToBase64String(
                            await PassCrypto.encryptFileKey({ ...dto, fileID, pending: false })
                        ),
                    }))
                ),
                ItemKeyRotation: dto.itemKey.rotation,
            },
        })
    ).Result.Item;

export const linkPendingFiles = async <T extends ItemType>(dto: ItemRevisionLinkFiles): Promise<ItemRevision<T>> => {
    const { revision, shareId, itemId, files } = dto;
    const itemKey = await resolveItemKey(shareId, itemId);

    try {
        const encryptedItem = await (async (): Promise<ItemRevisionContentsResponse> => {
            if (files.toAdd.length || files.toRemove.length) {
                const FilesToAdd = await Promise.all(
                    files.toAdd.map(async (FileID) => ({
                        FileID,
                        FileKey: uint8ArrayToBase64String(
                            await PassCrypto.encryptFileKey({
                                fileID: FileID,
                                itemKey,
                                shareId,
                                pending: true,
                            })
                        ),
                    }))
                );

                /** Max simultaneous files to add/remove per action are 10/100 */
                const addChunks = chunk(FilesToAdd, 10);
                const removeChunks = chunk(files.toRemove, 100);

                const maxCalls = Math.max(addChunks.length, removeChunks.length);
                let result = null;

                for (let i = 0; i < maxCalls; i++) {
                    const currentFilesToAdd = addChunks[i] ?? [];
                    const currentFilesToRemove = removeChunks[i] ?? [];

                    result = await api({
                        url: `pass/v1/share/${shareId}/item/${itemId}/link_files`,
                        data: {
                            ItemRevision: revision,
                            FilesToAdd: currentFilesToAdd,
                            FilesToRemove: currentFilesToRemove,
                        } satisfies LinkFileToItemInput,
                        method: 'post',
                    });
                }

                /** If no files to restore we can early return */
                if (!files.toRestore?.length && result) return result.Item;
            }

            if (files.toRestore?.length) {
                /** Max simultaneous files to restore per action are 50 */
                const restoreChunks = chunk(files.toRestore, 50);
                let result = null;

                for (let i = 0; i < restoreChunks.length; i++) {
                    const toRestore = restoreChunks[i] ?? [];
                    result = await restoreRevisionFiles({ shareId, itemId, toRestore, itemKey });
                }

                return result!;
            }

            throw new Error('Invalid file link operation');
        })();

        return await parseItemRevision<T>(dto.shareId, encryptedItem);
    } finally {
        /** Unregister pending file keys when linking completes */
        files.toAdd.forEach((fileID) => PassCrypto.unregisterFileKey({ fileID, shareId, pending: true }));
    }
};

export const resolveItemFiles = async ({ shareId, itemId }: UniqueItem): Promise<ItemFileOutput[]> =>
    createPageIterator({
        request: async (Since) => {
            const { Files } = await api({
                url: `pass/v1/share/${shareId}/item/${itemId}/files`,
                method: 'get',
                params: Since ? { Since } : {},
            });

            return { data: Files.Files ?? [], cursor: Files.LastID };
        },
    })();

export const resolveItemFilesRevision = async ({ shareId, itemId }: UniqueItem): Promise<ItemFileOutput[]> =>
    createPageIterator({
        request: async (Since) => {
            const { Files } = await api({
                url: `pass/v1/share/${shareId}/item/${itemId}/revisions/files`,
                method: 'get',
                params: Since ? { Since } : {},
            });

            return { data: Files.Files ?? [], cursor: Files.LastID };
        },
    })();

export const resolvePublicItemFiles = async (
    filesToken: string,
    itemKey: string,
    linkKey: string
): Promise<SecureLinkItem['files']> => {
    const {
        Files: { Files },
    } = await api({
        url: `pass/v1/public_link/files/${filesToken}`,
        method: 'get',
    });

    return {
        content: await intoPublicFileDescriptors(Files, itemKey, linkKey),
        token: filesToken,
    };
};

export const updateLinkedFileMetadata = async ({
    shareId,
    itemId,
    metadata,
    fileID,
}: UniqueItem & { metadata: string; fileID: FileID }): Promise<string> =>
    (
        await api({
            url: `pass/v1/share/${shareId}/item/${itemId}/file/${fileID}/metadata`,
            data: { Metadata: metadata },
            method: 'put',
        })
    ).File!.FileID;
