import { useCallback, useEffect, useRef, useState } from 'react';

import { useShallow } from 'zustand/react/shallow';

import { useActiveBreakpoint, useAuthentication } from '@proton/components';
import type { ProtonDrivePublicLinkClient } from '@proton/drive';
import { MemberRole, NodeType } from '@proton/drive';
import { uploadManager } from '@proton/drive/modules/upload';
import type { SORT_DIRECTION } from '@proton/shared/lib/constants';
import { isProtonDocsDocument, isProtonDocsSpreadsheet } from '@proton/shared/lib/helpers/mimetype';
import { isPreviewAvailable } from '@proton/shared/lib/helpers/preview';
import { LayoutSetting } from '@proton/shared/lib/interfaces/drive/userSettings';

import { useDocumentActions } from '../../hooks/docs/useDocumentActions';
import { useBatchThumbnailLoader } from '../../hooks/drive/useBatchThumbnailLoader';
import usePublicToken from '../../hooks/drive/usePublicToken';
import { downloadManager } from '../../managers/download/DownloadManager';
import { useDrivePublicPreviewModal } from '../../modals/preview';
import { useContextMenuStore } from '../../modules/contextMenu';
import { useSelectionStore } from '../../modules/selection';
import type { SortConfig, SortField } from '../../modules/sorting';
import { Breadcrumbs } from '../../statelessComponents/Breadcrumbs/Breadcrumbs';
import type { CrumbDefinition } from '../../statelessComponents/Breadcrumbs/types';
import { BreadcrumbRenderingMode } from '../../statelessComponents/Breadcrumbs/types';
import { DriveExplorer } from '../../statelessComponents/DriveExplorer/DriveExplorer';
import type {
    DriveExplorerConditions,
    DriveExplorerEvents,
    DriveExplorerSelection,
    DriveExplorerSort,
} from '../../statelessComponents/DriveExplorer/types';
import { UploadDragDrop } from '../../statelessComponents/UploadDragDrop/UploadDragDrop';
import { useDriveDocsFeatureFlag, useIsSheetsEnabled } from '../../store/_documents';
import { useSdkErrorHandler } from '../../utils/errorHandling/useSdkErrorHandler';
import { getNodeAncestry } from '../../utils/sdk/getNodeAncestry';
import { getNodeEntity } from '../../utils/sdk/getNodeEntity';
import { getPublicFolderCells } from './PublicFolderDriveExplorerCells';
import { PublicFolderItemContextMenu } from './PublicFolderItemContextMenu';
import { PublicFolderPageEmptyView } from './PublicFolderPageEmptyView';
import { getPublicLinkClient } from './publicLinkClient';
import { subscribeToPublicFolderEvents } from './subscribeToPublicFolderEvents';
import { usePublicAuthStore } from './usePublicAuth.store';
import { usePublicFolderStore } from './usePublicFolder.store';
import { usePublicFolderLoader } from './usePublicFolderLoader';

export interface PublicFolderViewProps {
    nodeUid: string;
    folderName: string;
}

const usePublicBreadcrumb = (driveClient: ProtonDrivePublicLinkClient) => {
    const [loading, setLoading] = useState(true);
    const [data, setData] = useState<CrumbDefinition[]>([]);
    const { handleError } = useSdkErrorHandler();

    const load = async (nodeUid: string) => {
        setLoading(true);
        const result = await getNodeAncestry(nodeUid, driveClient);
        if (result.ok) {
            const data = result.value.map((maybeNode) => {
                const nodeEntity = getNodeEntity(maybeNode).node;
                return {
                    uid: nodeEntity.uid,
                    name: nodeEntity.name,
                    // Do not render signature issues for breadcrumb items on public page.
                    haveSignatureIssues: false,
                    supportDropOperations: false,
                };
            });
            setData(data);
        } else {
            handleError(result.error);
            setData([]);
        }
        setLoading(false);
    };

    return {
        loading,
        data,
        load,
    };
};

export const PublicFolderView = ({ nodeUid, folderName }: PublicFolderViewProps) => {
    const publicDriveClient = getPublicLinkClient();
    const { loadPublicFolderChildren } = usePublicFolderLoader();
    const { loading: breadcrumbLoading, data: crumbs, load: loadBreadcrumbs } = usePublicBreadcrumb(publicDriveClient);

    const [previewModal, showPreviewModal] = useDrivePublicPreviewModal();
    const contextMenuControls = useContextMenuStore();
    const contextMenuAnchorRef = useRef<HTMLDivElement>(null);

    const { loadThumbnail } = useBatchThumbnailLoader({ drive: publicDriveClient });
    const { isDocsEnabled } = useDriveDocsFeatureFlag();
    const isSheetsEnabled = useIsSheetsEnabled();
    const { openDocument } = useDocumentActions();
    const authentication = useAuthentication();
    const { selectedItemIds } = useSelectionStore(
        useShallow((state) => ({
            selectedItemIds: state.selectedItemIds,
        }))
    );

    const { publicRole } = usePublicAuthStore();

    const { isLoading, hasEverLoaded, sortField, direction, itemUids, folder } = usePublicFolderStore(
        useShallow((state) => ({
            folder: state.folder,
            isLoading: state.isLoading,
            hasEverLoaded: state.hasEverLoaded,
            sortField: state.sortField,
            direction: state.direction,
            itemUids: state.itemUids,
        }))
    );

    // TODO: Probably moving it to the store of public folder
    useEffect(() => {
        useSelectionStore.getState().setAllItemIds(itemUids);
    }, [itemUids]);

    useEffect(() => {
        if (folder) {
            const unsub = subscribeToPublicFolderEvents();

            return () => {
                unsub();
            };
        }
    }, [folder]);

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
            usePublicFolderStore.getState().setSorting({ sortField, direction, sortConfig });
        },
        []
    );

    const isEmpty = hasEverLoaded && !isLoading && itemUids.size === 0;

    const loadView = (nodeUid: string) => {
        const abortController = new AbortController();
        void loadPublicFolderChildren(nodeUid, abortController.signal);
        void loadBreadcrumbs(nodeUid);
        return abortController;
    };

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

        loadView(item.uid);
    };

    const handleRenderItem = useCallback(
        (uid: string) => {
            const storeItem = usePublicFolderStore.getState().getFolderItem(uid);
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
        [loadThumbnail]
    );

    useEffect(() => {
        const abortController = loadView(nodeUid);
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
        onItemClick: () => {
            if (contextMenuControls.isOpen) {
                contextMenuControls.close();
            }
        },
        onItemDoubleClick: (uid) => {
            void handleOpenItem(uid);
        },
        onItemContextMenu: (uid, event) => {
            contextMenuControls.handleContextMenu(event);
        },
        onItemRender: (uid) => {
            handleRenderItem(uid);
        },
    };

    const selectionStore = useSelectionStore.getState();
    const selection: DriveExplorerSelection = {
        selectedItems: new Set(selectedItemIds),
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

    const cells = getPublicFolderCells({
        viewportWidth,
        onDownload: handleDownload,
    });

    const conditions: DriveExplorerConditions = {
        isDraggable: () => false,
        isDoubleClickable: () => true,
    };
    const handleDrop = (dataTransfer: DataTransfer) => {
        void uploadManager.upload(dataTransfer, nodeUid);
    };

    return (
        <UploadDragDrop className="h-full" disabled={publicRole === MemberRole.Viewer} onDrop={handleDrop}>
            <PublicFolderItemContextMenu
                anchorRef={contextMenuAnchorRef}
                close={contextMenuControls.close}
                isOpen={contextMenuControls.isOpen}
                open={contextMenuControls.open}
                position={contextMenuControls.position}
            />
            {isEmpty ? (
                <PublicFolderPageEmptyView nodeUid={nodeUid} token={token} />
            ) : (
                <>
                    <Breadcrumbs
                        renderingMode={BreadcrumbRenderingMode.Prominent}
                        loading={breadcrumbLoading}
                        crumbs={crumbs}
                        events={{
                            onBreadcrumbItemClick: (nodeUid: string) => {
                                loadView(nodeUid);
                            },
                        }}
                    />
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
                        contextMenuControls={{
                            isOpen: contextMenuControls.isOpen,
                            showContextMenu: contextMenuControls.handleContextMenu,
                            close: contextMenuControls.close,
                        }}
                    />
                </>
            )}
            {previewModal}
        </UploadDragDrop>
    );
};
