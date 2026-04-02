import { useCallback, useEffect } from 'react';

import { useShallow } from 'zustand/react/shallow';

import { NodeType, getDrive, getDriveForPhotos, getDrivePerNodeType, splitNodeUid } from '@proton/drive';
import { loadThumbnail } from '@proton/drive/modules/thumbnails';
import type { SORT_DIRECTION } from '@proton/shared/lib/constants';
import { isNativeProtonDocsAppFile } from '@proton/shared/lib/helpers/mimetype';
import isTruthy from '@proton/utils/isTruthy';

import { useFlagsDriveSDKPreview } from '../../../flags/useFlagsDriveSDKPreview';
import useDriveNavigation from '../../../hooks/drive/useNavigate';
import { useUserSettings } from '../../../hooks/user';
import { useDrivePreviewModal } from '../../../modals/preview';
import { useSelectionStore } from '../../../modules/selection';
import type { SortConfig, SortField } from '../../../modules/sorting/types';
import { getOpenInDocsInfo, openDocsOrSheetsDocument } from '../../../utils/docs/openInDocs';
import { ItemType, useSharedWithMeStore } from '../useSharedWithMe.store';
import { useBookmarksActions } from './useBookmarksActions';

export const useSharedWithMeItems = () => {
    const { navigateToNodeUid, navigateToAlbum } = useDriveNavigation();
    const { openBookmark } = useBookmarksActions();
    const { layout } = useUserSettings();
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
    } = useSharedWithMeStore(
        useShallow((state) => ({
            getSharedWithMeStoreItem: state.getSharedWithMeItem,
            sortedUids: state.sortedItemUids,
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

    const isSDKPreviewEnabled = useFlagsDriveSDKPreview();
    const { previewModal, showPreviewModal } = useDrivePreviewModal();

    useEffect(() => {
        setAllItemIds(new Set(sortedUids));
    }, [sortedUids, setAllItemIds]);

    const handleRenderItem = useCallback(
        ({ id }: { id: string }) => {
            const renderedItem = getSharedWithMeStoreItem(id);
            if (renderedItem?.activeRevisionUid && renderedItem.itemType !== ItemType.BOOKMARK) {
                loadThumbnail(renderedItem.type === NodeType.Photo ? getDriveForPhotos() : getDrive(), {
                    nodeUid: renderedItem.nodeUid,
                    revisionUid: renderedItem.activeRevisionUid,
                });
            }
        },
        [getSharedWithMeStoreItem]
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
        async (uid: string) => {
            const item = getSharedWithMeStoreItem(uid);
            if (!item || item.itemType === ItemType.INVITATION) {
                return;
            }
            if (item.itemType === ItemType.BOOKMARK) {
                await openBookmark(item.bookmark.url);
                return;
            }
            document.getSelection()?.removeAllRanges();

            const { nodeId } = splitNodeUid(item.nodeUid);
            if (item.mediaType && isNativeProtonDocsAppFile(item.mediaType)) {
                const openInDocsInfo = getOpenInDocsInfo(item.mediaType);
                if (openInDocsInfo) {
                    await openDocsOrSheetsDocument({
                        uid: item.nodeUid,
                        type: openInDocsInfo.type,
                        isNative: openInDocsInfo.isNative,
                        openBehavior: 'tab',
                    });
                    return;
                }
            }

            if (item.type === NodeType.Album) {
                navigateToAlbum(item.shareId, nodeId);
                return;
            }

            if ((item.type === NodeType.File || item.type === NodeType.Photo) && isSDKPreviewEnabled) {
                showPreviewModal({
                    drive: getDrivePerNodeType(item.type),
                    deprecatedContextShareId: '',
                    nodeUid: item.nodeUid,
                });
                return;
            }

            await navigateToNodeUid(item.nodeUid);
        },
        [
            navigateToNodeUid,
            openBookmark,
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
