import { api } from '@proton/pass/lib/api/api';
import { PassCrypto } from '@proton/pass/lib/crypto';
import { intoFileDescriptor } from '@proton/pass/lib/file-attachments/helpers';
import { parseItemRevision } from '@proton/pass/lib/items/item.parser';
import { getLatestItemKey } from '@proton/pass/lib/items/item.requests';
import type {
    FileDownloadChunk,
    FileDownloadPublicChunk,
    FileID,
    FileRestoreDTO,
    ItemFileOutput,
    ItemLatestKeyResponse,
    ItemLinkPendingFiles,
    ItemRevision,
    ItemRevisionContentsResponse,
    LinkFileToItemInput,
    SecureLinkItem,
    SelectedItem,
    UniqueItem,
} from '@proton/pass/types';
import { uint8ArrayToBase64String } from '@proton/shared/lib/helpers/encoding';

export const createPendingFile = async (metadata: string, totalChunks: number): Promise<string> =>
    (
        await api({
            url: `pass/v1/file`,
            data: { Metadata: metadata, ChunkCount: totalChunks },
            method: 'post',
        })
    ).File!.FileID;

export const uploadFileChunk = async (fileId: string, chunkIndex: number, chunkData: Blob) =>
    api({
        url: `pass/v1/file/${fileId}/chunk`,
        input: 'form',
        data: { ChunkIndex: chunkIndex, ChunkData: chunkData },
        output: 'raw',
        method: 'post',
    });

export const downloadFileChunk = async (dto: FileDownloadChunk): Promise<ReadableStream> =>
    api({
        url: `pass/v1/share/${dto.shareId}/item/${dto.itemId}/file/${dto.fileID}/chunk/${dto.chunkID}`,
        method: 'get',
        output: 'stream',
        headers: { 'Content-Type': 'application/octet-stream' },
    });

export const downloadPublicFileChunk = async (dto: FileDownloadPublicChunk): Promise<ReadableStream> =>
    api({
        url: `pass/v1/public_link/files/${dto.filesToken}/${dto.fileID}/${dto.chunkID}`,
        method: 'get',
        output: 'stream',
        headers: { 'Content-Type': 'application/octet-stream' },
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
    latestItemKey: ItemLatestKeyResponse
): Promise<ItemFileOutput> =>
    (
        await api({
            url: `pass/v1/share/${shareId}/item/${itemId}/file/${fileId}/restore`,
            method: 'post',
            data: {
                FileKey: uint8ArrayToBase64String(
                    await PassCrypto.getFileKey({ fileID: fileId, shareId, latestItemKey })
                ),
                ItemKeyRotation: latestItemKey.KeyRotation,
            },
        })
    ).Result.File;

export const restoreRevisionFiles = async (
    dto: { toRestore: FileID[]; latestItemKey: ItemLatestKeyResponse } & SelectedItem
): Promise<ItemRevisionContentsResponse> =>
    (
        await api({
            url: `pass/v1/share/${dto.shareId}/item/${dto.itemId}/file/restore`,
            method: 'post',
            data: {
                FilesToRestore: await Promise.all(
                    dto.toRestore.map(async (fileID) => ({
                        FileID: fileID,
                        FileKey: uint8ArrayToBase64String(await PassCrypto.getFileKey({ ...dto, fileID })),
                    }))
                ),
                ItemKeyRotation: dto.latestItemKey.KeyRotation,
            },
        })
    ).Result.Item;

export const linkPendingFiles = async (dto: ItemLinkPendingFiles): Promise<ItemRevision> => {
    const { revision, shareId, itemId, files } = dto;
    const latestItemKey = await getLatestItemKey(dto);

    const encryptedItem = await (async (): Promise<ItemRevisionContentsResponse> => {
        if (files.toAdd.length || files.toRemove.length) {
            const FilesToAdd = await Promise.all(
                files.toAdd.map(async (FileID) => ({
                    FileID,
                    FileKey: uint8ArrayToBase64String(
                        await PassCrypto.getFileKey({
                            fileID: FileID,
                            shareId,
                            latestItemKey,
                        })
                    ),
                }))
            );

            const result = await api({
                url: `pass/v1/share/${shareId}/item/${itemId}/link_files`,
                data: {
                    ItemRevision: revision,
                    FilesToAdd,
                    FilesToRemove: files.toRemove,
                } satisfies LinkFileToItemInput,
                method: 'post',
            });

            /** If no files to restore we can early return */
            if (!files.toRestore?.length) return result.Item;
        }

        if (files.toRestore?.length) {
            return restoreRevisionFiles({
                shareId,
                itemId,
                toRestore: files.toRestore,
                latestItemKey,
            });
        }

        throw new Error('Invalid file link operation');
    })();

    return parseItemRevision(dto.shareId, encryptedItem);
};

export const resolveItemFiles = async ({ shareId, itemId }: UniqueItem): Promise<ItemFileOutput[]> =>
    (await api({ url: `pass/v1/share/${shareId}/item/${itemId}/files`, method: 'get' })).Files!.Files;

export const resolveItemFilesRevision = async ({ shareId, itemId }: UniqueItem): Promise<ItemFileOutput[]> =>
    (await api({ url: `pass/v1/share/${shareId}/item/${itemId}/revisions/files`, method: 'get' })).Files!.Files;

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
        content: await intoFileDescriptor(Files, (file) =>
            PassCrypto.openSecureLinkFileDescriptor({
                encryptedItemKey: itemKey,
                encryptedFileKey: file.FileKey,
                encryptedMetadata: file.Metadata,
                fileID: file.FileID,
                linkKey,
            })
        ),
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
