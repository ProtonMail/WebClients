import { useCallback, useMemo } from 'react';

import { useShallow } from 'zustand/react/shallow';

import { NodeType, getDrive, getDrivePerNodeType, splitNodeUid } from '@proton/drive';
import type { SORT_DIRECTION } from '@proton/shared/lib/constants';
import isTruthy from '@proton/utils/isTruthy';

import { useFlagsDriveSDKPreview } from '../../../flags/useFlagsDriveSDKPreview';
import { useBatchThumbnailLoader } from '../../../hooks/drive/useBatchThumbnailLoader';
import useDriveNavigation from '../../../hooks/drive/useNavigate';
import { useOnItemRenderedMetrics } from '../../../hooks/drive/useOnItemRenderedMetrics';
import { useDrivePreviewModal } from '../../../modals/preview';
import { useSelectionStore } from '../../../modules/selection';
import type { SortConfig, SortField } from '../../../modules/sorting/types';
import { useUserSettings } from '../../../store';
import { getOpenInDocsInfo, openDocsOrSheetsDocument } from '../../../utils/docs/openInDocs';
import { getNodeEntity } from '../../../utils/sdk/getNodeEntity';
import { getRootNode } from '../../../utils/sdk/mapNodeToLegacyItem';
import { useSearchViewStore } from '../store';

export const useSearchResultItems = () => {
    const { navigateToLink, navigateToAlbum } = useDriveNavigation();

    const { loadThumbnail } = useBatchThumbnailLoader({ drive: getDrive() });
    const { layout } = useUserSettings();
    const {
        selectedItemIds,
        selectItem,
        toggleSelectItem,
        toggleAllSelected,
        toggleRange,
        clearSelections,
        isSelected,
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
            getSelectionState: state.getSelectionState,
        }))
    );

    const { sortedItemUids, loading, hasEverLoaded, sortField, direction } = useSearchViewStore(
        useShallow((state) => ({
            sortedItemUids: state.sortedItemUids,
            loading: state.loading,
            hasEverLoaded: state.hasEverLoaded,
            sortField: state.sortField,
            direction: state.direction,
        }))
    );

    const { incrementItemRenderedCounter } = useOnItemRenderedMetrics(layout, !hasEverLoaded);

    const [previewModal, showPreviewModal] = useDrivePreviewModal();

    const handleRenderItem = useCallback(
        ({ id }: { id: string }) => {
            incrementItemRenderedCounter();
            const renderedItem = useSearchViewStore.getState().getSearchResultItem(id);

            if (renderedItem?.thumbnailId) {
                loadThumbnail({
                    uid: renderedItem.nodeUid,
                    thumbnailId: renderedItem.thumbnailId,
                    hasThumbnail: true,
                    cachedThumbnailUrl: '',
                });
            }
        },
        [incrementItemRenderedCounter, loadThumbnail]
    );

    const handleSorting = ({
        sortField,
        direction,
        sortConfig,
    }: {
        sortField: SortField;
        direction: SORT_DIRECTION;
        sortConfig: SortConfig;
    }) => {
        useSearchViewStore.getState().setSorting({ sortField, direction, sortConfig });
    };

    const selectedItems = Array.from(selectedItemIds)
        .map((uid) => useSearchViewStore.getState().getSearchResultItem(uid))
        .filter(isTruthy);
    const isSDKPreviewEnabled = useFlagsDriveSDKPreview();

    const handleOpenItem = useCallback(
        async (uid: string) => {
            const item = useSearchViewStore.getState().getSearchResultItem(uid);
            if (!item) {
                return;
            }
            document.getSelection()?.removeAllRanges();

            // Get root node share id to for navigation calls below.
            const { nodeId } = splitNodeUid(item.nodeUid);
            const drive = getDrive();
            const maybeNode = await drive.getNode(item.nodeUid);
            const node = getNodeEntity(maybeNode).node;
            const rootNode = await getRootNode(node, getDrive());
            const deprecatedShareId = rootNode.deprecatedShareId || '';

            if (item.mediaType) {
                const openInDocInfo = getOpenInDocsInfo(item.mediaType);
                if (openInDocInfo) {
                    void openDocsOrSheetsDocument({
                        uid: node.uid,
                        ...openInDocInfo,
                    });
                    return;
                }
            }

            if (item.type === NodeType.Album) {
                navigateToAlbum(deprecatedShareId, nodeId);
                return;
            }

            if ((item.type === NodeType.File || item.type === NodeType.Photo) && isSDKPreviewEnabled) {
                showPreviewModal({
                    drive: getDrivePerNodeType(item.type),
                    deprecatedContextShareId: deprecatedShareId,
                    nodeUid: item.nodeUid,
                });
                return;
            }

            navigateToLink(deprecatedShareId, nodeId, item.type === NodeType.File);
        },
        [isSDKPreviewEnabled, navigateToAlbum, navigateToLink, showPreviewModal]
    );

    const sortParams = useMemo(() => ({ sortField, sortOrder: direction }), [direction, sortField]);

    const selectedItemIdsArray = Array.from(selectedItemIds);
    const selectionState = getSelectionState();

    const selectionControls = useMemo(
        () => ({
            selectedItemIds: selectedItemIdsArray,
            selectItem,
            toggleSelectItem,
            toggleAllSelected,
            toggleRange,
            clearSelections,
            isSelected,
            selectionState,
        }),
        [
            selectedItemIdsArray,
            selectItem,
            toggleSelectItem,
            toggleAllSelected,
            toggleRange,
            clearSelections,
            isSelected,
            selectionState,
        ]
    );

    return {
        sortedItemUids,
        selectedItems,
        loading,
        layout,
        sortParams,
        handleOpenItem,
        handleRenderItem,
        handleSorting,
        previewModal,
        selectionControls,
    };
};
