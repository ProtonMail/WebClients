import type { FolderData, FolderDeleteDTO, FolderId, ShareId } from '../../types';
import type { FolderCreateInputDto, FolderDataResponse, FolderUpdateInputDto } from '../../types/api/pass';
import { logId, logger } from '../../utils/logger';
import { api } from '../api/api';
import { createPageIterator } from '../api/utils';
import { parseFolderResponse } from './folders.parser';

export const getAllFoldersApi = async (shareId: string): Promise<FolderDataResponse[]> =>
    createPageIterator({
        request: async (Since) => {
            const {
                Folders: { Folders, LastToken },
            } = await api({
                url: `pass/v1/share/${shareId}/folder`,
                method: 'get',
                params: Since ? { Since } : {},
            });

            return { data: Folders ?? [], cursor: LastToken };
        },
    })();

export const hasFoldersApi = async (shareId: ShareId): Promise<boolean> => {
    const {
        Folders: { Folders },
    } = await api({ url: `pass/v1/share/${shareId}/folder`, method: 'get' });

    return (Folders ?? []).length > 0;
};

export const fetchFolder = async (shareId: ShareId, folderId: FolderId): Promise<FolderDataResponse> => {
    const { Folder } = await api({ url: `pass/v1/share/${shareId}/folder/${folderId}`, method: 'get' });
    return Folder;
};

/** A folder key is encrypted with its parent folder key, so parents are decrypted first.
 * A folder that fails is skipped instead of leaving the whole vault with no folders.
 * Parents missing from `encryptedFolders` are expected to be already registered in `PassCrypto`. */
export const parseFoldersInOrder = async (
    shareId: ShareId,
    encryptedFolders: FolderDataResponse[]
): Promise<FolderData[]> => {
    const folderMap = new Map<FolderId, FolderDataResponse>(encryptedFolders.map((f) => [f.FolderID, f]));

    const decryptedFolders: FolderData[] = [];
    const visited = new Set<string>();

    const decryptFolder = async (encryptedFolder: FolderDataResponse): Promise<void> => {
        const folderId = encryptedFolder.FolderID;
        if (visited.has(folderId)) return;
        visited.add(folderId);

        const parentFolderId = encryptedFolder.ParentFolderID;
        if (parentFolderId && !visited.has(parentFolderId)) {
            const parent = folderMap.get(parentFolderId);
            if (parent) await decryptFolder(parent);
        }

        try {
            decryptedFolders.push(await parseFolderResponse(shareId, encryptedFolder));
        } catch (err) {
            /** Note: skipping a folder also hides every descendant so the whole branch
             * and its items silently disappear from the UI. We may consider displaying
             * a warning to the user as a future improvement. */
            logger.warn(`[Folder] Failed parsing folder ${logId(folderId)}`, err);
        }
    };

    for (const encryptedFolder of encryptedFolders) {
        await decryptFolder(encryptedFolder);
    }

    return decryptedFolders;
};

export const requestFoldersForShareId = async (shareId: ShareId): Promise<FolderData[]> =>
    parseFoldersInOrder(shareId, await getAllFoldersApi(shareId));

export const createFolderApi = async ({
    shareId,
    ...data
}: { shareId: string } & FolderCreateInputDto): Promise<{ Folder: FolderDataResponse }> =>
    api({
        url: `pass/v1/share/${shareId}/folder`,
        method: 'post',
        data,
    });

export const updateFolderApi = async ({
    shareId,
    folderId,
    ...data
}: { shareId: string; folderId: string } & FolderUpdateInputDto): Promise<{ Folder: FolderDataResponse }> =>
    api({
        url: `pass/v1/share/${shareId}/folder/${folderId}`,
        method: 'put',
        data,
    });

export const deleteFoldersApi = async ({ shareId, folderIds }: FolderDeleteDTO) =>
    api({
        url: `pass/v1/share/${shareId}/folder`,
        method: 'delete',
        data: { FolderIDs: folderIds },
    });
