import { NodeType } from '@proton/drive/index';

import { ItemType, type SharedWithMeListingItemUI } from '../../../zustand/sections/sharedWithMeListing.store';

// TODO: Consider implementing action capabilities pattern
// Similar to node capabilities, we could provide specific action capabilities for better separation of concerns.
// This would involve creating a getCapabilities(selectionChecker) function that returns specific booleans like:
// - canDeleteBookmark: selectionChecker.isOnlyBookmarks
// - canAccept: selectionChecker.isOnlyInvitation && selectionChecker.isOnlyOneItem
// - canShare, canShowDetails, etc.
// This would make actions easier to render and unit test by providing simple boolean flags
// rather than having complex logic scattered across action components.

export interface ItemTypeChecker {
    hasInvitations: boolean;
    hasBookmarks: boolean;
    hasAlbums: boolean;
    hasFiles: boolean;
    hasFolders: boolean;
    isOnlyBookmarks: boolean;
    isOnlyInvitations: boolean;
    isOnlyOneItem: boolean;
    isOnlyOneFile: boolean;
    hasPreviewAvailable: (isPreviewAvailableFn: (mimeType: string, size?: number) => boolean) => boolean;
    hasDirectShares: boolean;
    canDownload: boolean;
    canOpenInDocs: boolean;
    items: SharedWithMeListingItemUI[];
}

export const createItemChecker = (items: SharedWithMeListingItemUI[]): ItemTypeChecker => {
    const metadata = items.reduce(
        (acc, item) => {
            if (item.itemType === ItemType.INVITATION) {
                acc.hasInvitations = true;
            }
            if (item.itemType === ItemType.BOOKMARK) {
                acc.hasBookmarks = true;
            }
            if (item.itemType === ItemType.DIRECT_SHARE) {
                acc.hasDirectShares = true;
            }
            if (item.type === NodeType.Album) {
                acc.hasAlbums = true;
                acc.hasNonDownloadableItems = true;
            }
            if (item.type === NodeType.File) {
                acc.hasFiles = true;
            }
            if (item.type === NodeType.Folder) {
                acc.hasFolders = true;
            }
            if (item.itemType !== ItemType.BOOKMARK) {
                acc.allBookmarks = false;
            }
            if (item.itemType !== ItemType.INVITATION) {
                acc.allInvitations = false;
            }
            return acc;
        },
        {
            hasInvitations: false,
            hasBookmarks: false,
            hasDirectShares: false,
            hasAlbums: false,
            hasFiles: false,
            hasFolders: false,
            hasNonDownloadableItems: false,
            allBookmarks: items.length > 0,
            allInvitations: items.length > 0,
        }
    );

    const singleItem = items[0];
    const isOnlyOneItem = items.length === 1;

    return {
        hasInvitations: metadata.hasInvitations,
        hasBookmarks: metadata.hasBookmarks,
        hasAlbums: metadata.hasAlbums,
        hasFiles: metadata.hasFiles,
        hasFolders: metadata.hasFolders,
        isOnlyBookmarks: metadata.allBookmarks,
        isOnlyInvitations: metadata.allInvitations,
        isOnlyOneItem: isOnlyOneItem,
        isOnlyOneFile: isOnlyOneItem && singleItem?.type === NodeType.File,
        hasPreviewAvailable: (isPreviewAvailableFn) => {
            return (
                isOnlyOneItem &&
                singleItem?.type === NodeType.File &&
                !!singleItem.mediaType &&
                isPreviewAvailableFn(singleItem.mediaType, singleItem.size)
            );
        },
        hasDirectShares: metadata.hasDirectShares,
        canDownload: items.length > 0 && !metadata.hasNonDownloadableItems,
        canOpenInDocs: isOnlyOneItem && singleItem?.type === NodeType.File,
        items,
    };
};

export const mapToLegacyFormat = (items: SharedWithMeListingItemUI[]) => {
    return items.map((item) => ({
        rootShareId: item.legacy.shareId,
        mimeType: item.mediaType || '',
        linkId: item.legacy.linkId,
        isFile: item.type === NodeType.File,
        name: item.name,
        size: item.size || 0,
        parentLinkId: '', // No parentLinkId on shared with me items
        volumeId: item.legacy.volumeId,
    }));
};
