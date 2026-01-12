import { useCallback, useEffect } from 'react';

import { useShallow } from 'zustand/react/shallow';

import { useActiveBreakpoint, useAuthentication } from '@proton/components';
import { NodeType } from '@proton/drive';
import type { SORT_DIRECTION } from '@proton/shared/lib/constants';
import { isProtonDocsDocument, isProtonDocsSpreadsheet } from '@proton/shared/lib/helpers/mimetype';
import { isPreviewAvailable } from '@proton/shared/lib/helpers/preview';
import { LayoutSetting } from '@proton/shared/lib/interfaces/drive/userSettings';

import { useDocumentActions } from '../../hooks/docs/useDocumentActions';
import { useBatchThumbnailLoader } from '../../hooks/drive/useBatchThumbnailLoader';
import usePublicToken from '../../hooks/drive/usePublicToken';
import { downloadManager } from '../../managers/download/DownloadManager';
import { useDrivePublicPreviewModal } from '../../modals/preview';
import { useSelectionStore } from '../../modules/selection';
import type { SortConfig, SortField } from '../../modules/sorting';
import { DriveExplorer } from '../../statelessComponents/DriveExplorer/DriveExplorer';
import type {
    DriveExplorerConditions,
    DriveExplorerEvents,
    DriveExplorerSelection,
    DriveExplorerSort,
} from '../../statelessComponents/DriveExplorer/types';
import { useDriveDocsFeatureFlag, useIsSheetsEnabled } from '../../store/_documents';
import { getPublicFolderCells } from './PublicFolderDriveExplorerCells';
import { PublicFolderPageEmptyView } from './PublicFolderPageEmptyView';
import { getPublicLinkClient } from './publicLinkClient';
import { usePublicFolderStore } from './usePublicFolder.store';
import { usePublicFolderLoader } from './usePublicFolderLoader';

export interface PublicFolderViewProps {
    nodeUid: string;
    folderName: string;
}

export const PublicFolderView = ({ nodeUid, folderName }: PublicFolderViewProps) => {
    const { loadPublicFolderChildren } = usePublicFolderLoader();
    const [previewModal, showPreviewModal] = useDrivePublicPreviewModal();

    const publicDriveClient = getPublicLinkClient();
    const { loadThumbnail } = useBatchThumbnailLoader({ drive: publicDriveClient });
    const { isDocsEnabled } = useDriveDocsFeatureFlag();
    const isSheetsEnabled = useIsSheetsEnabled();
    const { openDocument } = useDocumentActions();
    const authentication = useAuthentication();
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

    const { isLoading, getFolderItem, hasEverLoaded, sortField, direction, setSorting, itemUids } =
        usePublicFolderStore(
            useShallow((state) => ({
                getFolderItem: state.getFolderItem,
                isLoading: state.isLoading,
                hasEverLoaded: state.hasEverLoaded,
                sortField: state.sortField,
                direction: state.direction,
                setSorting: state.setSorting,
                itemUids: state.itemUids,
            }))
        );

    // TODO: Probably moving it to the store of public folder
    useEffect(() => {
        useSelectionStore.getState().setAllItemIds(itemUids);
    }, [itemUids]);

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

    const isEmpty = hasEverLoaded && !isLoading && itemUids.size === 0;

    const handleOpenItem = (uid: string) => {
        const item = usePublicFolderStore.getState().getFolderItem(uid);

        if (!item) {
            return;
        }
        document.getSelection()?.removeAllRanges();

        if (item.mediaType && isProtonDocsDocument(item.mediaType)) {
            if (isDocsEnabled) {
                return openDocument({
                    type: 'doc',
                    uid,
                    openBehavior: 'tab',
                });
            }
            return;
        } else if (item.mediaType && isProtonDocsSpreadsheet(item.mediaType)) {
            if (isSheetsEnabled) {
                return openDocument({
                    uid,
                    type: 'sheet',
                    openBehavior: 'tab',
                });
            }
            return;
        }

        if (item.type === NodeType.File || item.type === NodeType.Photo) {
            const previewableNodeUids = [];
            for (const itemUid of itemUids) {
                const item = usePublicFolderStore.getState().getFolderItem(itemUid);
                if (!item) {
                    continue;
                }
                if (item.mediaType && isPreviewAvailable(item?.mediaType, item.size)) {
                    previewableNodeUids.push(itemUid);
                }
            }

            showPreviewModal({
                drive: publicDriveClient,
                // TODO: This is temporary hack to prevent passing the deprecatedContextShareId
                // This property was need for legacy compatibility. As we only use new sdk logic here, this will never be used
                deprecatedContextShareId: '',
                nodeUid: item.uid,
                previewableNodeUids,
                verifySignatures: Boolean(authentication.getUID()),
            });

            return;
        }
        void loadPublicFolderChildren(item.uid, new AbortController().signal);
    };

    const handleRenderItem = useCallback(
        (uid: string) => {
            const storeItem = getFolderItem(uid);
            if (!storeItem) {
                return;
            }

            loadThumbnail({
                uid: storeItem.uid,
                thumbnailId: storeItem.thumbnailId || storeItem.uid,
                hasThumbnail: !!storeItem.thumbnailId,
                cachedThumbnailUrl: undefined,
            });
        },
        [getFolderItem, loadThumbnail]
    );

    useEffect(() => {
        const abortController = new AbortController();

        void loadPublicFolderChildren(nodeUid, abortController.signal);

        return () => {
            abortController.abort();
        };
    }, [loadPublicFolderChildren, nodeUid]);

    const { token } = usePublicToken();
    const { viewportWidth } = useActiveBreakpoint();

    const sort: DriveExplorerSort = {
        sortBy: sortField,
        sortDirection: direction,
        onSort: handleSorting,
    };

    const handleDownload = (uid: string) => {
        void downloadManager.download([uid]);
    };

    const events: DriveExplorerEvents = {
        onItemDoubleClick: (uid) => {
            void handleOpenItem(uid);
        },
        onItemRender: (uid) => {
            handleRenderItem(uid);
        },
    };

    const selection: DriveExplorerSelection = {
        selectedItems: new Set(selectedItemIds),
        selectionMethods: {
            selectionState: getSelectionState(),
            selectItem,
            toggleSelectItem,
            toggleRange,
            toggleAllSelected,
            clearSelections,
            isSelected,
        },
    };

    const cells = getPublicFolderCells({
        viewportWidth,
        onDownload: handleDownload,
    });

    const conditions: DriveExplorerConditions = {
        isDraggable: () => false,
        isDoubleClickable: () => true,
    };

    return (
        <div className="h-full">
            {isEmpty ? (
                <PublicFolderPageEmptyView nodeUid={nodeUid} token={token} />
            ) : (
                <DriveExplorer
                    itemIds={Array.from(itemUids.values())}
                    layout={LayoutSetting.List}
                    cells={cells}
                    selection={selection}
                    events={events}
                    conditions={conditions}
                    sort={sort}
                    loading={isLoading}
                    caption={folderName}
                    config={{ itemHeight: 52 }}
                />
            )}
            {previewModal}
        </div>
    );
};
