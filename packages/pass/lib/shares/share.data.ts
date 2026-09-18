import { toMap } from '@proton/shared/lib/helpers/object';

import type { FoldersByShareId, ItemsByShareId } from '../../store/reducers';
import type { FolderData, ItemRevision, Share } from '../../types';
import { diadic } from '../../utils/fp/variadics';
import { logId, logger } from '../../utils/logger';
import { merge } from '../../utils/object/merge';
import { requestFoldersForShareId } from '../folders/folders.requests';
import { requestItemsForShareId } from '../items/item.requests';
import { isVaultShare } from './share.predicates';

export type ShareData = { folders: FolderData[]; items: ItemRevision[] };
export type SharesData = { folders: FoldersByShareId; items: ItemsByShareId };

type ShareDataOptions = {
    /** When set, a folder fetch failure is reported here instead of throwing. */
    onFolderError?: (error: unknown) => void;
    onItemProgress?: (progress: number) => void;
};

const requestFolders = async (share: Share, onError?: (error: unknown) => void): Promise<FolderData[]> => {
    // Folders only exist on vault shares
    if (!isVaultShare(share)) return [];

    try {
        return await requestFoldersForShareId(share.shareId);
    } catch (error) {
        if (!onError) throw error;
        onError(error);
        return [];
    }
};

/** Resolves a share's folders and items. Folders are always resolved first:
 * opening an item requires its parent FolderKey to be registered, which
 * happens when the folder is resolved (`PassCrypto.openFolder`). */
export const requestShareData = async (share: Share, options: ShareDataOptions = {}): Promise<ShareData> => {
    const folders = await requestFolders(share, options.onFolderError);
    const items = await requestItemsForShareId(share.shareId, options.onItemProgress);

    return { folders, items };
};

/** Folder failures are tolerated per share, item failures are not. */
export const requestSharesData = async (shares: Share[]): Promise<SharesData> => {
    const resolved = await Promise.all(
        shares.map(async (share) => {
            const { shareId } = share;
            const { folders, items } = await requestShareData(share, {
                onFolderError: (error) =>
                    logger.warn(`[Sync] Failed to sync folders for share ${logId(shareId)}`, error),
            });

            return {
                folders: { [shareId]: toMap(folders, 'folderId') },
                items: { [shareId]: toMap(items, 'itemId') },
            };
        })
    );

    return {
        folders: resolved.map((res) => res.folders).reduce<FoldersByShareId>(diadic(merge), {}),
        items: resolved.map((res) => res.items).reduce<ItemsByShareId>(diadic(merge), {}),
    };
};
