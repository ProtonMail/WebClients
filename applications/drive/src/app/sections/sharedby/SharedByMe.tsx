import { useCallback, useEffect, useRef } from 'react';

import { c } from 'ttag';
import { useShallow } from 'zustand/react/shallow';

import { useActiveBreakpoint } from '@proton/components';
import { NodeType, getDriveForPhotos, getDrivePerNodeType, splitNodeUid } from '@proton/drive';
import { loadThumbnail } from '@proton/drive/modules/thumbnails';
import type { SORT_DIRECTION } from '@proton/shared/lib/constants';
import { isNativeProtonDocsAppFile } from '@proton/shared/lib/helpers/mimetype';

import { useFlagsDriveSDKPreview } from '../../flags/useFlagsDriveSDKPreview';
import useDriveNavigation from '../../hooks/drive/useNavigate';
import { useOnItemRenderedMetrics } from '../../hooks/drive/useOnItemRenderedMetrics';
import { useDrivePreviewModal } from '../../modals/preview';
import { useContextMenuStore } from '../../modules/contextMenu';
import { useSelectionStore } from '../../modules/selection';
import type { SortConfig, SortField } from '../../modules/sorting/types';
import { DriveExplorer } from '../../statelessComponents/DriveExplorer/DriveExplorer';
import type {
    DriveExplorerEvents,
    DriveExplorerSelection,
    DriveExplorerSort,
} from '../../statelessComponents/DriveExplorer/types';
import { useUserSettings } from '../../store';
import { getOpenInDocsInfo, openDocsOrSheetsDocument } from '../../utils/docs/openInDocs';
import { EmptySharedByMe } from './EmptySharedByMe';
import { getSharedByMeCells, getSharedByMeGrid } from './SharedByMeDriveExplorerCells';
import { SharedByMeItemContextMenu } from './SharedByMeItemContextMenu';
import { useSharedByMeStore } from './useSharedByMe.store';

export const SharedByMe = () => {
    const { viewportWidth } = useActiveBreakpoint();
    const contextMenu = useContextMenuStore();
    const contextMenuAnchorRef = useRef<HTMLDivElement>(null);

    const { layout } = useUserSettings();
    const { navigateToAlbum, navigateToNodeUid } = useDriveNavigation();
    const isSDKPreviewEnabled = useFlagsDriveSDKPreview();
    const { previewModal, showPreviewModal } = useDrivePreviewModal();

    const { sortedItemUids, isLoading, hasEverLoaded, sortField, direction } = useSharedByMeStore(
        useShallow((state) => ({
            sortedItemUids: state.sortedItemUids,
            isLoading: state.isLoading,
            hasEverLoaded: state.hasEverLoaded,
            sortField: state.sortField,
            direction: state.direction,
        }))
    );

    const { incrementItemRenderedCounter } = useOnItemRenderedMetrics(layout, !hasEverLoaded);

    const selectedItemIds = useSelectionStore(useShallow((state) => state.selectedItemIds));

    useEffect(() => {
        useSelectionStore.getState().setAllItemIds(sortedItemUids);
    }, [sortedItemUids]);

    const handleRenderItem = useCallback(
        (uid: string) => {
            incrementItemRenderedCounter();
            const storeItem = useSharedByMeStore.getState().getSharedByMeItem(uid);
            if (!storeItem) {
                return;
            }

            if (storeItem.activeRevisionUid) {
                loadThumbnail(getDrivePerNodeType(storeItem.type), {
                    nodeUid: storeItem.nodeUid,
                    revisionUid: storeItem.activeRevisionUid,
                });
            }
        },
        [incrementItemRenderedCounter]
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
            useSharedByMeStore.getState().setSorting({ sortField, direction, sortConfig });
        },
        []
    );

    const handleOpenItem = async (uid: string) => {
        const storeItem = useSharedByMeStore.getState().getSharedByMeItem(uid);
        if (!storeItem) {
            return;
        }

        document.getSelection()?.removeAllRanges();

        if (storeItem.mediaType && isNativeProtonDocsAppFile(storeItem.mediaType)) {
            const openInDocsInfo = getOpenInDocsInfo(storeItem.mediaType);
            if (openInDocsInfo) {
                await openDocsOrSheetsDocument({
                    uid: storeItem.nodeUid,
                    isNative: openInDocsInfo?.isNative,
                    type: openInDocsInfo?.type,
                    openBehavior: 'tab',
                });
            }
        }

        if (storeItem.type === NodeType.Album) {
            const photosDeprecatedShareId = await getDriveForPhotos()
                .getMyPhotosRootFolder()
                .then((rootNode) => (rootNode.ok ? rootNode.value.deprecatedShareId : undefined));
            const { nodeId } = splitNodeUid(storeItem.nodeUid);
            if (!photosDeprecatedShareId) {
                return;
            }
            navigateToAlbum(photosDeprecatedShareId, nodeId);
            return;
        }

        if ((storeItem.type === NodeType.File || storeItem.type === NodeType.Photo) && isSDKPreviewEnabled) {
            showPreviewModal({
                drive: getDrivePerNodeType(storeItem.type),
                deprecatedContextShareId: '',
                nodeUid: storeItem.nodeUid,
            });
            return;
        }

        await navigateToNodeUid(storeItem.nodeUid);
    };

    const isEmpty = hasEverLoaded && !isLoading && sortedItemUids.size === 0;

    if (isEmpty) {
        return <EmptySharedByMe />;
    }

    const selectionStore = useSelectionStore.getState();
    const selection: DriveExplorerSelection = {
        selectedItems: selectedItemIds,
        selectionMethods: {
            selectionState: selectionStore.getSelectionState(),
            selectItem: selectionStore.selectItem,
            toggleSelectItem: selectionStore.toggleSelectItem,
            toggleRange: selectionStore.toggleRange,
            toggleAllSelected: selectionStore.toggleAllSelected,
            clearSelections: selectionStore.clearSelections,
            isSelected: selectionStore.isSelected,
        },
    };

    const events: DriveExplorerEvents = {
        onItemClick: () => {
            if (contextMenu.isOpen) {
                contextMenu.close();
            }
        },
        onItemDoubleClick: (uid) => {
            void handleOpenItem(uid);
        },
        onItemContextMenu: (_uid, event) => {
            contextMenu.handleContextMenu(event);
        },
        onItemRender: (uid) => {
            handleRenderItem(uid);
        },
    };

    const sort: DriveExplorerSort = {
        sortBy: sortField,
        sortDirection: direction,
        onSort: handleSorting,
    };

    const cells = getSharedByMeCells({ viewportWidth });
    const grid = getSharedByMeGrid();

    return (
        <>
            <SharedByMeItemContextMenu anchorRef={contextMenuAnchorRef} />
            <div ref={contextMenuAnchorRef} className="flex flex-1">
                <DriveExplorer
                    itemIds={Array.from(sortedItemUids)}
                    layout={layout}
                    cells={cells}
                    grid={grid}
                    selection={selection}
                    events={events}
                    sort={sort}
                    loading={isLoading}
                    caption={c('Title').t`Shared`}
                    contextMenuControls={{
                        isOpen: contextMenu.isOpen,
                        showContextMenu: contextMenu.handleContextMenu,
                        close: contextMenu.close,
                    }}
                />
            </div>
            {previewModal}
        </>
    );
};
