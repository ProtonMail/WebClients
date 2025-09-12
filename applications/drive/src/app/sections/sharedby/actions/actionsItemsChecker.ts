import { NodeType, splitNodeUid } from '@proton/drive';

import type { SharedByMeItem } from '../useSharedByMe.store';

export interface ItemTypeChecker {
    hasFiles: boolean;
    hasFolders: boolean;
    hasAlbums: boolean;
    isOnlyOneItem: boolean;
    isOnlyOneFile: boolean;
    hasPreviewAvailable: (isPreviewAvailableFn: (mimeType: string, size?: number) => boolean) => boolean;
    canDownload: boolean;
    canOpenInDocs: boolean;
    canRename: boolean;
    canShare: boolean;
    canStopSharing: boolean;
    items: SharedByMeItem[];
}

export const createItemChecker = (items: SharedByMeItem[]): ItemTypeChecker => {
    const metadata = items.reduce(
        (acc, item) => {
            if (item.type === NodeType.File) {
                acc.hasFiles = true;
            } else {
                acc.hasFolders = true;
            }

            // Check if it's an album based on mediaType or other properties
            if (item.type === NodeType.Album) {
                acc.hasAlbums = true;
                acc.hasNonDownloadableItems = true;
            }

            return acc;
        },
        {
            hasFiles: false,
            hasFolders: false,
            hasAlbums: false,
            hasNonDownloadableItems: false,
        }
    );

    const singleItem = items.at(0);
    const isOnlyOneItem = items.length === 1 && !!singleItem;

    return {
        hasFiles: metadata.hasFiles,
        hasFolders: metadata.hasFolders,
        hasAlbums: metadata.hasAlbums,
        isOnlyOneItem: isOnlyOneItem,
        isOnlyOneFile: isOnlyOneItem && singleItem.type === NodeType.File,
        hasPreviewAvailable: (isPreviewAvailableFn) => {
            return (
                isOnlyOneItem &&
                singleItem.type === NodeType.File &&
                !!singleItem.mediaType &&
                isPreviewAvailableFn(singleItem.mediaType, singleItem.size)
            );
        },
        canDownload: items.length > 0 && !metadata.hasNonDownloadableItems,
        canOpenInDocs: isOnlyOneItem && singleItem.type === NodeType.File,
        canRename: isOnlyOneItem,
        canShare: isOnlyOneItem,
        canStopSharing: isOnlyOneItem && !!singleItem?.shareId,
        items,
    };
};

export const mapToLegacyFormat = (items: SharedByMeItem[]) => {
    return items.map((item) => {
        const { volumeId, nodeId } = splitNodeUid(item.nodeUid);
        const parentNodeId = item.parentUid ? splitNodeUid(item.parentUid).nodeId : '';
        return {
            rootShareId: item.rootShareId,
            mimeType: item.mediaType || '',
            linkId: nodeId,
            isFile: item.type === NodeType.File,
            name: item.name,
            size: item.size || 0,
            parentLinkId: parentNodeId,
            volumeId,
        };
    });
};
