import { useCallback, useEffect } from 'react';

import { useShallow } from 'zustand/react/shallow';

import { NodeType, getDrive, getDriveForPhotos, getDrivePerNodeType, splitNodeUid } from '@proton/drive';
import type { SORT_DIRECTION } from '@proton/shared/lib/constants';
import { isProtonDocsDocument, isProtonDocsSpreadsheet } from '@proton/shared/lib/helpers/mimetype';
import isTruthy from '@proton/utils/isTruthy';

import { useFlagsDriveSDKPreview } from '../../../flags/useFlagsDriveSDKPreview';
import { useBatchThumbnailLoader } from '../../../hooks/drive/useBatchThumbnailLoader';
import useDriveNavigation from '../../../hooks/drive/useNavigate';
import { useOnItemRenderedMetrics } from '../../../hooks/drive/useOnItemRenderedMetrics';
import { useDrivePreviewModal } from '../../../modals/preview';
import { useSelectionStore } from '../../../modules/selection';
import type { SortConfig, SortField } from '../../../modules/sorting/types';
import { useDocumentActions, useUserSettings } from '../../../store';
import { useDriveDocsFeatureFlag } from '../../../store/_documents';
import { ItemType, useSharedWithMeListingStore } from '../../../zustand/sections/sharedWithMeListing.store';
import { useBookmarksActions } from './useBookmarksActions';

export const useSharedWithMeItems = () => {
    const { navigateToLink, navigateToAlbum } = useDriveNavigation();
    const { openDocument } = useDocumentActions();
    const { isDocsEnabled } = useDriveDocsFeatureFlag();
    const { openBookmark } = useBookmarksActions();
    const { layout } = useUserSettings();
    // TODO: We should refactor the useBatchThumbnailLoader to support passing instance per item
    const { loadThumbnail } = useBatchThumbnailLoader({ drive: getDrive() });
    const { loadThumbnail: loadPhotosThumbnail } = useBatchThumbnailLoader({ drive: getDriveForPhotos() });

    const {
        selectedItemIds,
        selectItem,
        toggleSelectItem,
        toggleAllSelected,
        toggleRange,
        clearSelections,
        isSelected,
        setAllItemIds,
        getSelectionState,
    } = useSelectionStore(
        useShallow((state) => ({
            selectedItemIds: state.selectedItemIds,
            selectItem: state.selectItem,
            toggleSelectItem: state.toggleSelectItem,
            toggleAllSelected: state.toggleAllSelected,
            toggleRange: state.toggleRange,
            clearSelections: state.clearSelections,
            isSelected: state.isSelected,
            setAllItemIds: state.setAllItemIds,
            getSelectionState: state.getSelectionState,
        }))
    );

    const {
        getSharedWithMeStoreItem,
        sortedUids,
        clearItemsWithInvitationPosition,
        isLoading,
        hasEverLoaded,
        itemUidsSize,
        sortField,
        direction,
        setSorting,
    } = useSharedWithMeListingStore(
        useShallow((state) => ({
            getSharedWithMeStoreItem: state.getSharedWithMeItem,
            sortedUids: state.getItemUids(),
            clearItemsWithInvitationPosition: state.clearItemsWithInvitationPosition,
            isLoading: state.isLoading(),
            hasEverLoaded: state.hasEverLoaded,
            itemUidsSize: state.itemUids.size,
            sortField: state.sortField,
            direction: state.direction,
            setSorting: state.setSorting,
        }))
    );

    // Clear on components mount, first listing of items
    useEffect(() => {
        clearItemsWithInvitationPosition();
    }, [clearItemsWithInvitationPosition]);

    const { incrementItemRenderedCounter } = useOnItemRenderedMetrics(layout, !hasEverLoaded);

    const isSDKPreviewEnabled = useFlagsDriveSDKPreview();
    const { previewModal, showPreviewModal } = useDrivePreviewModal();

    useEffect(() => {
        setAllItemIds(new Set(sortedUids));
    }, [sortedUids, setAllItemIds]);

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

    const handleSorting = useCallback(
        ({
            sortField,
            direction,
            sortConfig,
        }: {
            sortField: SortField;
            direction: SORT_DIRECTION;
            sortConfig: SortConfig;
        }) => {
            setSorting({ sortField, direction, sortConfig });
        },
        [setSorting]
    );

    const selectedItems = Array.from(selectedItemIds)
        .map((id) => getSharedWithMeStoreItem(id))
        .filter(isTruthy);

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
            navigateToLink,
            openBookmark,
            isDocsEnabled,
            openDocument,
            navigateToAlbum,
            getSharedWithMeStoreItem,
            isSDKPreviewEnabled,
            showPreviewModal,
        ]
    );

    const isEmpty = hasEverLoaded && !isLoading && itemUidsSize === 0;

    return {
        uids: sortedUids,
        selectedItems,
        isLoading,
        layout,
        sortParams: { sortField, sortOrder: direction },
        handleOpenItem,
        handleRenderItem,
        handleSorting,
        isEmpty,
        previewModal,
        selectionControls: {
            selectedItemIds: Array.from(selectedItemIds),
            selectItem,
            toggleSelectItem,
            toggleAllSelected,
            toggleRange,
            clearSelections,
            isSelected,
            selectionState: getSelectionState(),
        },
    };
};
