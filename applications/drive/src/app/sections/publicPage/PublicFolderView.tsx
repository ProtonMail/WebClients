import { useCallback, useEffect, useRef, useState } from 'react';

import { useShallow } from 'zustand/react/shallow';

import { useActiveBreakpoint } from '@proton/components';
import type { NodeEntity, ProtonDrivePublicLinkClient } from '@proton/drive';
import { MemberRole, NodeType } from '@proton/drive';
import { uploadManager } from '@proton/drive/modules/upload';
import type { SORT_DIRECTION } from '@proton/shared/lib/constants';
import { isNativeProtonDocsAppFile } from '@proton/shared/lib/helpers/mimetype';
import { LayoutSetting } from '@proton/shared/lib/interfaces/drive/userSettings';

import { useBatchThumbnailLoader } from '../../hooks/drive/useBatchThumbnailLoader';
import { useUploadInput } from '../../hooks/drive/useUploadInput';
import { useContextMenuStore } from '../../modules/contextMenu';
import { useSelectionStore } from '../../modules/selection';
import type { SortConfig, SortField } from '../../modules/sorting';
import { Breadcrumbs } from '../../statelessComponents/Breadcrumbs/Breadcrumbs';
import type { CrumbDefinition } from '../../statelessComponents/Breadcrumbs/types';
import { DriveExplorer } from '../../statelessComponents/DriveExplorer/DriveExplorer';
import type {
    DriveExplorerConditions,
    DriveExplorerEvents,
    DriveExplorerSelection,
    DriveExplorerSort,
} from '../../statelessComponents/DriveExplorer/types';
import { UploadDragDrop } from '../../statelessComponents/UploadDragDrop/UploadDragDrop';
import { getOpenInDocsInfo } from '../../utils/docs/openInDocs';
import { useSdkErrorHandler } from '../../utils/errorHandling/useSdkErrorHandler';
import { getNodeAncestry } from '../../utils/sdk/getNodeAncestry';
import { getNodeEntity } from '../../utils/sdk/getNodeEntity';
import { getPublicFolderCells } from './PublicFolderDriveExplorerCells';
import { PublicFolderEmptyView } from './PublicFolderEmptyView';
import { PublicFolderItemContextMenu } from './PublicFolderItemContextMenu';
import { PublicHeader } from './PublicHeader';
import { usePublicActions } from './actions/usePublicActions';
import { getPublicLinkClient } from './publicLinkClient';
import { subscribeToPublicFolderEvents } from './subscribeToPublicFolderEvents';
import { usePublicAuthStore } from './usePublicAuth.store';
import { usePublicFolderStore } from './usePublicFolder.store';
import { usePublicFolderLoader } from './usePublicFolderLoader';

interface PublicFolderViewProps {
    rootNode: NodeEntity;
    customPassword?: string;
    isPartialView?: boolean;
}

const usePublicBreadcrumb = (driveClient: ProtonDrivePublicLinkClient) => {
    const [loading, setLoading] = useState(true);
    const [data, setData] = useState<CrumbDefinition[]>([]);
    const { handleError } = useSdkErrorHandler();

    const load = useCallback(
        async (nodeUid: string) => {
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
        },
        [driveClient, handleError]
    );

    return {
        loading,
        data,
        load,
    };
};

export const PublicFolderView = ({ rootNode, customPassword, isPartialView }: PublicFolderViewProps) => {
    const publicDriveClient = getPublicLinkClient();
    const { loadPublicFolderChildren } = usePublicFolderLoader();
    const { loading: breadcrumbLoading, data: crumbs, load: loadBreadcrumbs } = usePublicBreadcrumb(publicDriveClient);

    const contextMenuControls = useContextMenuStore();
    const contextMenuAnchorRef = useRef<HTMLDivElement>(null);

    const { loadThumbnail } = useBatchThumbnailLoader({ drive: publicDriveClient });
    const { selectedItemIds } = useSelectionStore(
        useShallow((state) => ({
            selectedItemIds: state.selectedItemIds,
        }))
    );

    const {
        modals,
        handleOpenDocsOrSheets,
        handleDownload,
        handleDetails,
        handlePreview,
        handleCopyLink,
        handleCreateFolder,
        handleCreateDocsOrSheets,
    } = usePublicActions();

    const { publicRole } = usePublicAuthStore(
        useShallow((state) => ({
            publicRole: state.publicRole,
        }))
    );

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

    const currentFolderUid = folder?.uid || rootNode.uid;

    const handleUpload = useCallback(
        (files: FileList) => {
            return uploadManager.upload(files, currentFolderUid);
        },
        [currentFolderUid]
    );

    const handleDrop = (dataTransfer: DataTransfer) => {
        void uploadManager.upload(dataTransfer, currentFolderUid);
    };

    const {
        inputRef: fileInputRef,
        handleClick: handleClickFileUpload,
        handleChange: handleFileChange,
    } = useUploadInput({
        onUpload: handleUpload,
        forFolders: false,
    });

    const {
        inputRef: folderInputRef,
        handleClick: handleClickFolderUpload,
        handleChange: handleFolderChange,
    } = useUploadInput({
        onUpload: handleUpload,
        forFolders: true,
    });

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

    const loadView = useCallback(
        (nodeUid: string) => {
            const abortController = new AbortController();
            void loadPublicFolderChildren(nodeUid, abortController.signal);
            void loadBreadcrumbs(nodeUid);
            return abortController;
        },
        [loadBreadcrumbs, loadPublicFolderChildren]
    );

    const handleOpenItem = (uid: string) => {
        const item = usePublicFolderStore.getState().getFolderItem(uid);

        if (!item) {
            return;
        }
        document.getSelection()?.removeAllRanges();

        if (item.mediaType && isNativeProtonDocsAppFile(item.mediaType)) {
            const openInDocsInfo = getOpenInDocsInfo(item.mediaType);
            if (openInDocsInfo) {
                return handleOpenDocsOrSheets(uid, openInDocsInfo, customPassword);
            }
        }
        if (item.type === NodeType.File || item.type === NodeType.Photo) {
            return handlePreview(uid);
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
        const abortController = loadView(rootNode.uid);
        return () => {
            abortController.abort();
        };
    }, [loadView, rootNode.uid]);

    const { viewportWidth } = useActiveBreakpoint();

    const sort: DriveExplorerSort = {
        sortBy: sortField,
        sortDirection: direction,
        onSort: handleSorting,
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

    const cells = getPublicFolderCells({
        viewportWidth,
        onDownload: (uid: string) => handleDownload([uid]),
    });

    const handleHeaderDownload = (shouldScan?: boolean) => {
        if (selectedItemIds.size > 0) {
            return handleDownload(Array.from(selectedItemIds.values()), shouldScan);
        }
        return handleDownload(Array.from(itemUids.values()), shouldScan);
    };

    const conditions: DriveExplorerConditions = {
        isDraggable: () => false,
        isDoubleClickable: () => true,
    };

    const isViewer = publicRole === MemberRole.Viewer;

    return (
        <UploadDragDrop className="h-full" disabled={isViewer} onDrop={handleDrop}>
            <input multiple type="file" ref={fileInputRef} className="hidden" onChange={handleFileChange} />
            <input multiple type="file" ref={folderInputRef} className="hidden" onChange={handleFolderChange} />
            <PublicFolderItemContextMenu
                anchorRef={contextMenuAnchorRef}
                close={contextMenuControls.close}
                isOpen={contextMenuControls.isOpen}
                open={contextMenuControls.open}
                position={contextMenuControls.position}
                customPassword={customPassword}
            />
            <PublicHeader
                breadcrumbOrName={
                    <Breadcrumbs
                        loading={breadcrumbLoading}
                        crumbs={crumbs}
                        events={{
                            onBreadcrumbItemClick: (nodeUid: string) => {
                                loadView(nodeUid);
                            },
                        }}
                    />
                }
                sharedBy={
                    (rootNode.keyAuthor.ok ? rootNode.keyAuthor.value : rootNode.keyAuthor.error.claimedAuthor) ||
                    undefined
                }
                onDownload={() => handleHeaderDownload()}
                onScanAndDownload={() => handleHeaderDownload(true)}
                onDetails={() => handleDetails(currentFolderUid)}
                onCopyLink={handleCopyLink}
                onUploadFile={!isViewer ? handleClickFileUpload : undefined}
                onUploadFolder={!isViewer ? handleClickFolderUpload : undefined}
                onCreateFolder={!isViewer ? () => handleCreateFolder(currentFolderUid) : undefined}
                onCreateDocument={
                    !isViewer ? () => handleCreateDocsOrSheets(currentFolderUid, 'document', customPassword) : undefined
                }
                onCreateSpreadsheet={
                    !isViewer
                        ? () => handleCreateDocsOrSheets(currentFolderUid, 'spreadsheet', customPassword)
                        : undefined
                }
                nbSelected={selectedItemIds.size}
                isEmptyView={isEmpty}
                customPassword={customPassword}
                isPartialView={isPartialView}
            />

            {isEmpty ? (
                <PublicFolderEmptyView uploadEnabled={!isViewer} onUpload={handleUpload} />
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
                    caption={folder?.uid || rootNode.name}
                    config={{ itemHeight: 52 }}
                    contextMenuControls={{
                        isOpen: contextMenuControls.isOpen,
                        showContextMenu: contextMenuControls.handleContextMenu,
                        close: contextMenuControls.close,
                    }}
                />
            )}
            {modals.previewModal}
            {modals.detailsModal}
            {modals.createFolderModal}
        </UploadDragDrop>
    );
};
