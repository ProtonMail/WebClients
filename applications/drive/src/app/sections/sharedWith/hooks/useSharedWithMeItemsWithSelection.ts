import { useCallback, useEffect, useMemo } from 'react';

import { useShallow } from 'zustand/react/shallow';

import { NodeType, getDrive, getDriveForPhotos, getDrivePerNodeType, splitNodeUid } from '@proton/drive';
import { SORT_DIRECTION } from '@proton/shared/lib/constants';
import { isProtonDocsDocument, isProtonDocsSpreadsheet } from '@proton/shared/lib/helpers/mimetype';
import isTruthy from '@proton/utils/isTruthy';

import { useSelection } from '../../../components/FileBrowser';
import { useFlagsDriveSDKPreview } from '../../../flags/useFlagsDriveSDKPreview';
import { useBatchThumbnailLoader } from '../../../hooks/drive/useBatchThumbnailLoader';
import useDriveNavigation from '../../../hooks/drive/useNavigate';
import { useOnItemRenderedMetrics } from '../../../hooks/drive/useOnItemRenderedMetrics';
import { type SortField, type SortParams, useSortingWithDefault } from '../../../hooks/util/useSorting';
import { useDrivePreviewModal } from '../../../modals/preview';
import { useDocumentActions, useUserSettings } from '../../../store';
import { useDriveDocsFeatureFlag } from '../../../store/_documents';
import { dateToLegacyTimestamp } from '../../../utils/sdk/legacyTime';
import { ItemType, getKeyUid, useSharedWithMeListingStore } from '../../../zustand/sections/sharedWithMeListing.store';
import { useBookmarksActions } from './useBookmarksActions';

const DEFAULT_SORT = {
    sortField: 'sharedOn' as SortField,
    sortOrder: SORT_DIRECTION.DESC,
};

const getSelectedItemsId = (items: { id: string }[], selectedItemIds: string[]) =>
    selectedItemIds.map((selectedItemId) => items.find((item) => selectedItemId === item.id)).filter(isTruthy);

/**
 * This hook is meant to be deleted.
 * It was created to unload the main SharedWithMe component from business complexity
 * What we want to achieve is to have stuff done differently in FileBrowser
 * For the thumbnail loading, it will be directly connected to it instead of passing this handleRenderItem calback
 * We want also to remove the mapping on legacy type, which will be removed with the FileBrowser refactor
 */
export const useSharedWithMeItemsWithSelection = () => {
    const { navigateToLink, navigateToAlbum } = useDriveNavigation();
    const selectionControls = useSelection();
    const { openDocument } = useDocumentActions();
    const { isDocsEnabled } = useDriveDocsFeatureFlag();
    const { openBookmark } = useBookmarksActions();
    const { layout } = useUserSettings();
    // TODO: We should refactor the useBatchThumbnailLoader to support passing instance per item
    const { loadThumbnail } = useBatchThumbnailLoader({ drive: getDrive() });
    const { loadThumbnail: loadPhotosThumbnail } = useBatchThumbnailLoader({ drive: getDriveForPhotos() });

    const {
        getSharedWithMeStoreItem,
        invitationPositionedItems,
        regularItems,
        clearItemsWithInvitationPosition,
        isLoading,
        hasEverLoaded,
        itemUidsSize,
    } = useSharedWithMeListingStore(
        useShallow((state) => ({
            getSharedWithMeStoreItem: state.getSharedWithMeItem,
            invitationPositionedItems: state.getInvitationPositionedItems(),
            regularItems: state.getRegularItems(),
            clearItemsWithInvitationPosition: state.clearItemsWithInvitationPosition,
            isLoading: state.isLoading(),
            hasEverLoaded: state.hasEverLoaded,
            itemUidsSize: state.itemUids.size,
        }))
    );

    // Clear on components mount, first listing of items
    useEffect(() => {
        clearItemsWithInvitationPosition();
    }, [clearItemsWithInvitationPosition]);

    const { incrementItemRenderedCounter } = useOnItemRenderedMetrics(layout, !hasEverLoaded);

    const isSDKPreviewEnabled = useFlagsDriveSDKPreview();
    const { previewModal, showPreviewModal } = useDrivePreviewModal();

    // Do not add logic here, it will be removed later
    const handleRenderItem = useCallback(
        ({ id }: { id: string }) => {
            incrementItemRenderedCounter();
            const renderedItem = getSharedWithMeStoreItem(id);
            if (renderedItem?.thumbnailId && renderedItem.itemType !== ItemType.BOOKMARK) {
                if (renderedItem.type === NodeType.Photo) {
                    loadPhotosThumbnail({
                        uid: renderedItem.nodeUid,
                        thumbnailId: renderedItem.thumbnailId,
                        hasThumbnail: true,
                        cachedThumbnailUrl: '',
                    });
                } else {
                    loadThumbnail({
                        uid: renderedItem.nodeUid,
                        thumbnailId: renderedItem.thumbnailId,
                        hasThumbnail: true,
                        cachedThumbnailUrl: '',
                    });
                }
            }
        },
        [getSharedWithMeStoreItem, incrementItemRenderedCounter, loadThumbnail, loadPhotosThumbnail]
    );

    // Map regular items for sorting
    const regularItemsToSort = regularItems.map((item) => ({
        uid: getKeyUid(item),
        isFile: item.type === NodeType.File || item.type === NodeType.Photo,
        name: item.name,
        mimeType: item.mediaType || '',
        size: 0,
        metaDataModifyTime: 0,
        fileModifyTime: 0,
        trashed: null,
        sharedOn:
            (item.itemType === ItemType.BOOKMARK && dateToLegacyTimestamp(item.bookmark.creationTime)) ||
            (item.itemType === ItemType.DIRECT_SHARE && dateToLegacyTimestamp(item.directShare.sharedOn)) ||
            undefined,
        sharedBy: (item.itemType === ItemType.DIRECT_SHARE && item.directShare.sharedBy) || '',
    }));

    const { sortedList, sortParams, setSorting } = useSortingWithDefault(regularItemsToSort, DEFAULT_SORT);

    const items = useMemo(() => [...invitationPositionedItems, ...sortedList], [invitationPositionedItems, sortedList]);

    const handleSorting = useCallback(
        (sortParamsInput: SortParams<SortField>) => {
            void setSorting(sortParamsInput);
            clearItemsWithInvitationPosition();
        },
        [clearItemsWithInvitationPosition, setSorting]
    );

    /*
     * This is intended to not adapt all the properties to the mappedItem.
     * All values for the UI will be fetched throught the store using the id/uid
     * This is here to adapt with the FileBrowser typing
     * */
    const getMapLegacyItems = useCallback(() => {
        const mappedItems = [];
        for (const item of items) {
            const keyUid = 'uid' in item ? item.uid : getKeyUid(item);
            const storeItem = getSharedWithMeStoreItem(keyUid);
            if (storeItem) {
                if (storeItem?.itemType === ItemType.BOOKMARK) {
                    mappedItems.push({
                        id: keyUid,
                        trashed: null,
                        volumeId: '',
                        parentLinkId: '',
                        rootShareId: '',
                        mimeType: storeItem.mediaType || '',
                        linkId: '',
                        isFile: storeItem.type === NodeType.File || storeItem.type === NodeType.Photo,
                        name: storeItem.name,
                        size: storeItem.size || 0,
                        isInvitation: false,
                        isBookmark: true,
                    });
                } else {
                    const { volumeId, nodeId } = splitNodeUid(keyUid);
                    mappedItems.push({
                        id: keyUid,
                        trashed: null,
                        volumeId,
                        parentLinkId: '', // parentLinkId is never defined in sharedWithMe section
                        rootShareId: storeItem.shareId,
                        mimeType: storeItem.mediaType || '',
                        linkId: nodeId,
                        isFile: storeItem.type === NodeType.File || storeItem.type === NodeType.Photo,
                        name: storeItem.name,
                        size: storeItem.size || 0,
                        thumbnailId: storeItem.thumbnailId,
                        isInvitation: storeItem.itemType === ItemType.INVITATION,
                        isAlbum: storeItem.type === NodeType.Album,
                    });
                }
            }
        }
        return mappedItems;
    }, [items, getSharedWithMeStoreItem]);

    const mapLegacyItems = useMemo(() => getMapLegacyItems(), [getMapLegacyItems]);

    const selectedItemIds = selectionControls?.selectedItemIds || [];
    const selectedItemsIds = getSelectedItemsId(mapLegacyItems, selectedItemIds);
    const selectedItems = useMemo(
        () => selectedItemsIds.map(({ id }) => getSharedWithMeStoreItem(id)).filter(isTruthy),
        [selectedItemsIds, getSharedWithMeStoreItem]
    );

    const handleOpenItem = useCallback(
        (uid: string) => {
            const item = getSharedWithMeStoreItem(uid);
            if (!item || item.itemType === ItemType.INVITATION) {
                return;
            }
            if (item.itemType === ItemType.BOOKMARK) {
                void openBookmark(item.bookmark.url);
                return;
            }
            document.getSelection()?.removeAllRanges();

            const { nodeId } = splitNodeUid(item.nodeUid);
            if (item.mediaType && isProtonDocsDocument(item.mediaType)) {
                if (isDocsEnabled) {
                    return openDocument({
                        type: 'doc',
                        linkId: nodeId,
                        shareId: item.shareId,
                        openBehavior: 'tab',
                    });
                }
                return;
            } else if (item.mediaType && isProtonDocsSpreadsheet(item.mediaType)) {
                if (isDocsEnabled) {
                    return openDocument({
                        type: 'sheet',
                        linkId: nodeId,
                        shareId: item.shareId,
                        openBehavior: 'tab',
                    });
                }
                return;
            }

            if (item.type === NodeType.Album) {
                navigateToAlbum(item.shareId, nodeId);
                return;
            }

            if ((item.type === NodeType.File || item.type === NodeType.Photo) && isSDKPreviewEnabled) {
                showPreviewModal({
                    drive: getDrivePerNodeType(item.type),
                    deprecatedContextShareId: item.shareId,
                    nodeUid: item.nodeUid,
                });
                return;
            }

            navigateToLink(item.shareId, nodeId, item.type === NodeType.File || item.type === NodeType.Photo);
        },
        [
            getSharedWithMeStoreItem,
            isSDKPreviewEnabled,
            navigateToLink,
            openBookmark,
            isDocsEnabled,
            openDocument,
            navigateToAlbum,
            showPreviewModal,
        ]
    );

    return {
        items: mapLegacyItems,
        selectedItems,
        isLoading,
        layout,
        sortParams,
        handleOpenItem,
        handleRenderItem,
        handleSorting,
        selectionControls,
        isEmpty: hasEverLoaded && !isLoading && itemUidsSize === 0,
        previewModal,
    };
};
