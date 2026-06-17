import { useCallback, useEffect, useRef, useState } from 'react';

import { c } from 'ttag';
import { useShallow } from 'zustand/react/shallow';

import { Button } from '@proton/atoms/Button/Button';
import { useActiveBreakpoint } from '@proton/components';
import type { NodeEntity, ProtonDrivePublicLinkClient } from '@proton/drive';
import { MemberRole, NodeType } from '@proton/drive';
import { handleSdkError } from '@proton/drive/legacy/errorHandling';
import { getNodeEntity } from '@proton/drive/legacy/sdkUtils/getNodeEntity';
import { getNodeAncestry, getNodeName } from '@proton/drive/modules/nodes';
import { loadThumbnail } from '@proton/drive/modules/thumbnails';
import { uploadManager } from '@proton/drive/modules/upload';
import { IcGrid3 } from '@proton/icons/icons/IcGrid3';
import { IcListBullets } from '@proton/icons/icons/IcListBullets';
import type { SORT_DIRECTION } from '@proton/shared/lib/constants';
import { isNativeProtonDocsAppFile } from '@proton/shared/lib/helpers/mimetype';
import { LayoutSetting } from '@proton/shared/lib/interfaces/drive/userSettings';

import { useUploadInput } from '../../legacy/hooks/drive/useUploadInput';
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
import { getPublicFolderCells, getPublicFolderGrid } from './PublicFolderDriveExplorerCells';
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
                        supportDropOperations: false,
                        haveSignatureIssues: false,
                    };
                });
                setData(data);
            } else {
                handleSdkError(result.error);
                setData([]);
            }
            setLoading(false);
        },
        [driveClient]
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

    const { isEditor, isLoggedIn } = usePublicAuthStore(
        useShallow((state) => ({
            isEditor: state.publicRole === MemberRole.Editor,
            isLoggedIn: state.isLoggedIn,
        }))
    );
    const canVerifySignature = isLoggedIn && isEditor;

    const { isLoading, hasEverLoaded, sortField, direction, itemUids, folder, layout } = usePublicFolderStore(
        useShallow((state) => ({
            folder: state.folder,
            isLoading: state.isLoading,
            hasEverLoaded: state.hasEverLoaded,
            sortField: state.sortField,
            direction: state.direction,
            itemUids: state.itemUids,
            layout: state.layout,
        }))
    );

    const currentFolderUid = folder?.uid || rootNode.uid;

    const handleDrop = (dataTransfer: DataTransfer) => {
        void uploadManager.upload(dataTransfer, currentFolderUid);
    };

    const {
        inputRef: fileInputRef,
        handleClick: handleClickFileUpload,
        handleChange: handleFileChange,
    } = useUploadInput({ onUpload: (files) => uploadManager.upload(files, currentFolderUid) });

    const {
        inputRef: folderInputRef,
        handleClick: handleClickFolderUpload,
        handleChange: handleFolderChange,
    } = useUploadInput({ onUpload: (files) => uploadManager.upload(files, currentFolderUid), forFolders: true });

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
            if (!storeItem?.activeRevisionUid) {
                return;
            }

            loadThumbnail(publicDriveClient, {
                nodeUid: storeItem.uid,
                revisionUid: storeItem.activeRevisionUid,
            });
        },
        [publicDriveClient]
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

    const grid = getPublicFolderGrid();

    const toggleLayout = () => {
        usePublicFolderStore
            .getState()
            .setLayout(layout === LayoutSetting.Grid ? LayoutSetting.List : LayoutSetting.Grid);
    };

    const handleHeaderDownload = (shouldScan?: boolean) => {
        if (selectedItemIds.size > 0) {
            return handleDownload(Array.from(selectedItemIds.values()), shouldScan);
        }
        return handleDownload(Array.from(itemUids.values()), shouldScan);
    };

    const conditions: Partial<DriveExplorerConditions> = {
        isDraggable: () => false,
    };

    return (
        <UploadDragDrop className="h-full flex flex-column flex-nowrap" disabled={!isEditor} onDrop={handleDrop}>
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
                    isEditor
                        ? (rootNode.keyAuthor.ok ? rootNode.keyAuthor.value : rootNode.keyAuthor.error.claimedAuthor) ||
                          undefined
                        : undefined
                }
                onDownload={() => handleHeaderDownload()}
                onScanAndDownload={() => handleHeaderDownload(true)}
                onDetails={canVerifySignature ? () => handleDetails(currentFolderUid) : undefined}
                onCopyLink={handleCopyLink}
                onUploadFile={isEditor ? handleClickFileUpload : undefined}
                onUploadFolder={isEditor ? handleClickFolderUpload : undefined}
                onCreateFolder={isEditor ? () => handleCreateFolder(currentFolderUid) : undefined}
                onCreateDocument={
                    isEditor ? () => handleCreateDocsOrSheets(currentFolderUid, 'document', customPassword) : undefined
                }
                onCreateSpreadsheet={
                    isEditor
                        ? () => handleCreateDocsOrSheets(currentFolderUid, 'spreadsheet', customPassword)
                        : undefined
                }
                nbSelected={selectedItemIds.size}
                isEmptyView={isEmpty}
                customPassword={customPassword}
                isPartialView={isPartialView}
            />

            {isEmpty ? (
                <PublicFolderEmptyView
                    uploadEnabled={isEditor}
                    onUploadFile={handleClickFileUpload}
                    onUploadFolder={handleClickFolderUpload}
                />
            ) : (
                <DriveExplorer
                    itemIds={Array.from(itemUids.values())}
                    layout={layout}
                    cells={cells}
                    grid={grid}
                    selection={selection}
                    events={events}
                    conditions={conditions}
                    sort={sort}
                    loading={isLoading}
                    caption={folder?.uid || getNodeName(rootNode)}
                    config={{ itemHeight: 52 }}
                    contextMenuControls={{
                        isOpen: contextMenuControls.isOpen,
                        showContextMenu: contextMenuControls.handleContextMenu,
                        close: contextMenuControls.close,
                    }}
                    headerActions={
                        <Button
                            icon
                            shape="ghost"
                            size="small"
                            onClick={toggleLayout}
                            title={c('Title').t`Change layout`}
                            data-testid="public-toolbar-layout"
                        >
                            {layout === LayoutSetting.Grid ? (
                                <IcListBullets alt={c('Action').t`List layout`} />
                            ) : (
                                <IcGrid3 alt={c('Action').t`Grid layout`} />
                            )}
                        </Button>
                    }
                />
            )}
            {modals.previewModal}
            {modals.detailsModal}
            {modals.createFolderModal}
        </UploadDragDrop>
    );
};
