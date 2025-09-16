import { useCallback, useEffect, useMemo, useRef } from 'react';

import { useShallow } from 'zustand/react/shallow';

import { useActiveBreakpoint } from '@proton/components';
import { MemberRole, NodeType, splitNodeUid } from '@proton/drive/index';
import { isProtonDocsDocument, isProtonDocsSpreadsheet } from '@proton/shared/lib/helpers/mimetype';
import type { LayoutSetting } from '@proton/shared/lib/interfaces/drive/userSettings';

import type { SortParams } from '../../../components/FileBrowser';
import FileBrowser, {
    type BrowserItemId,
    Cells,
    type FileBrowserBaseItem,
    GridHeader,
    type ListViewHeaderItem,
    useContextMenuControls,
    useItemContextMenu,
    useSelection,
} from '../../../components/FileBrowser';
import { NameCell } from '../../../components/cells/NameCell';
import { useLinkSharingModal } from '../../../components/modals/ShareLinkModal/ShareLinkModal';
import { GridViewItem } from '../../../components/sections/FileBrowser/GridViewItemLink';
import { ModifiedCell, ShareOptionsCell, SizeCell } from '../../../components/sections/FileBrowser/contentCells';
import headerItems from '../../../components/sections/FileBrowser/headerCells';
import { translateSortField } from '../../../components/sections/SortDropdown';
import useOpenPreview from '../../../components/useOpenPreview';
import type { DriveFolder } from '../../../hooks/drive/useActiveShare';
import { useBatchThumbnailLoader } from '../../../hooks/drive/useBatchThumbnailLoader';
import useDriveDragMove from '../../../hooks/drive/useDriveDragMove';
import useDriveNavigation from '../../../hooks/drive/useNavigate';
import { useOnItemRenderedMetrics } from '../../../hooks/drive/useOnItemRenderedMetrics';
import type { EncryptedLink, LinkShareUrl, SignatureIssues } from '../../../store';
import { useDocumentActions } from '../../../store';
import { useDriveDocsFeatureFlag } from '../../../store/_documents';
import { SortField } from '../../../store/_views/utils/useSorting';
import type { LegacyItem } from '../../../utils/sdk/mapNodeToLegacyItem';
import { useThumbnailStore } from '../../../zustand/thumbnails/thumbnails.store';
import { EmptyDeviceRoot } from '../EmptyFolder/EmptyDeviceRoot';
import { EmptyFolder } from '../EmptyFolder/EmptyFolder';
import { getSelectedItems } from '../getSelectedItems';
import type { FolderViewItem } from '../useFolder.store';
import { useFolderStore } from '../useFolder.store';
import { FolderContextMenu } from './FolderContextMenu';
import { FolderItemContextMenu } from './FolderItemContextMenu';

export interface DriveItem extends FileBrowserBaseItem {
    activeRevision?: EncryptedLink['activeRevision'];
    cachedThumbnailUrl?: string;
    hasThumbnail: boolean;
    isFile: boolean;
    mimeType: string;
    fileModifyTime: number;
    name: string;
    shareUrl?: LinkShareUrl;
    signatureIssues?: SignatureIssues;
    signatureEmail?: string;
    size: number;
    trashed: number | null;
    parentLinkId: string;
    isShared?: boolean;
    isAdmin: boolean;
    showLinkSharingModal?: ReturnType<typeof useLinkSharingModal>[1];
    volumeId: string;
}

interface Props {
    activeFolder: DriveFolder;
    layout: LayoutSetting;
    sortParams: SortParams<SortField.name | SortField.fileModifyTime | SortField.size>;
    setSorting: (sortParams: SortParams<SortField.name | SortField.fileModifyTime | SortField.size>) => Promise<void>;
    sortedList: FolderViewItem[];
}

type ItemWithAdditionalProps = LegacyItem & {
    onShareClick?: () => void;
    isAdmin: boolean;
};

const NameCellWithThumbnail = ({ item }: { item: ItemWithAdditionalProps }) => {
    const thumbnail = useThumbnailStore((state) =>
        item.thumbnailId ? state.getThumbnail(item.thumbnailId) : undefined
    );
    return (
        <NameCell
            name={item.name}
            mediaType={item.mimeType}
            type={item.isFile ? NodeType.File : NodeType.Folder}
            thumbnailUrl={thumbnail?.sdUrl}
            isInvitation={false}
            haveSignatureIssues={undefined}
        />
    );
};

const { CheckboxCell, ContextMenuCell } = Cells;

const myFilesLargeScreenCells: React.FC<{
    item: ItemWithAdditionalProps;
}>[] = [CheckboxCell, NameCellWithThumbnail, ModifiedCell, SizeCell, ShareOptionsCell, ContextMenuCell];
const myFilesSmallScreenCells = [CheckboxCell, NameCellWithThumbnail, ContextMenuCell];

const headerItemsLargeScreen: ListViewHeaderItem[] = [
    headerItems.checkbox,
    headerItems.name,
    headerItems.modificationDate,
    headerItems.size,
    headerItems.placeholder,
    headerItems.placeholder,
];

const headerItemsSmallScreen: ListViewHeaderItem[] = [headerItems.checkbox, headerItems.name, headerItems.placeholder];

type DriveSortFields = Extract<SortField, SortField.name | SortField.fileModifyTime | SortField.size>;
const SORT_FIELDS: DriveSortFields[] = [SortField.name, SortField.fileModifyTime, SortField.size];

export function FolderBrowser({ activeFolder, layout, sortParams, setSorting, sortedList }: Props) {
    const { shareId, linkId, volumeId } = activeFolder;
    const contextMenuAnchorRef = useRef<HTMLDivElement>(null);

    const browserContextMenu = useContextMenuControls();
    const browserItemContextMenu = useItemContextMenu();
    const { navigateToLink } = useDriveNavigation();
    const selectionControls = useSelection();
    const { viewportWidth } = useActiveBreakpoint();
    const { openDocument } = useDocumentActions();
    const { isDocsEnabled } = useDriveDocsFeatureFlag();
    const [linkSharingModal, showLinkSharingModal] = useLinkSharingModal();
    const { getThumbnail } = useThumbnailStore(
        useShallow((state) => ({
            getThumbnail: state.getThumbnail,
        }))
    );
    const { loadThumbnail } = useBatchThumbnailLoader();

    const openPreview = useOpenPreview();
    const { permissions, isLoading, role, folder } = useFolderStore(
        useShallow((state) => ({
            isLoading: state.isLoading,
            role: state.role,
            permissions: state.permissions,
            folder: state.folder,
        }))
    );

    const { incrementItemRenderedCounter } = useOnItemRenderedMetrics(layout, isLoading);
    const isAdmin = role === MemberRole.Admin;

    const browserItems = sortedList.map((node) => ({
        ...node,
        isAdmin,
        cachedThumbnailUrl: getThumbnail(node.thumbnailId)?.sdUrl,
        // TODO:FILEBROWSER Not super ideal but to avoid passing onShareClick inside the item we need to modify FB
        onShareClick: node.isShared
            ? () => showLinkSharingModal({ volumeId: node.volumeId, shareId: shareId, linkId: node.linkId })
            : undefined,
    }));

    const selectedItems = getSelectedItems(browserItems, selectionControls!.selectedItemIds);
    const { getDragMoveControls } = useDriveDragMove(shareId, browserItems, selectionControls!.clearSelections);

    /* eslint-disable react/display-name */
    const GridHeaderComponent = useMemo(
        () =>
            ({ scrollAreaRef }: { scrollAreaRef: React.RefObject<HTMLDivElement> }) => {
                const activeSortingText = translateSortField(sortParams.sortField);
                return (
                    <GridHeader
                        isLoading={isLoading}
                        sortFields={SORT_FIELDS}
                        onSort={setSorting}
                        sortField={sortParams.sortField}
                        sortOrder={sortParams.sortOrder}
                        itemCount={browserItems.length}
                        scrollAreaRef={scrollAreaRef}
                        activeSortingText={activeSortingText}
                    />
                );
            },
        [sortParams.sortField, sortParams.sortOrder, isLoading]
    );

    const handleItemRender = useCallback(
        async (item: ItemWithAdditionalProps) => {
            incrementItemRenderedCounter();

            loadThumbnail({
                uid: item.uid,
                thumbnailId: item.thumbnailId || item.uid,
                hasThumbnail: !!item.thumbnailId,
                cachedThumbnailUrl: undefined,
            });
        },
        [incrementItemRenderedCounter, loadThumbnail]
    );

    const handleClick = useCallback(
        (uid: BrowserItemId) => {
            const item = browserItems.find((item) => item.uid === uid);
            const { nodeId } = splitNodeUid(uid);

            if (!item) {
                return;
            }
            document.getSelection()?.removeAllRanges();

            // TODO:WIP Use helper to open files when avalable
            // applications/drive/src/app/hooks/docs/useDocumentActions.ts
            if (isProtonDocsDocument(item.mimeType)) {
                if (isDocsEnabled) {
                    return openDocument({
                        type: 'doc',
                        linkId: nodeId,
                        shareId,
                        openBehavior: 'tab',
                    });
                }
                return;
            } else if (isProtonDocsSpreadsheet(item.mimeType)) {
                if (isDocsEnabled) {
                    return openDocument({
                        type: 'sheet',
                        linkId: nodeId,
                        shareId,
                        openBehavior: 'tab',
                    });
                }
                return;
            }

            if (item.isFile) {
                openPreview(shareId, nodeId);
                return;
            }
            navigateToLink(shareId, nodeId, item.isFile);
        },
        [navigateToLink, shareId, browserItems, isDocsEnabled, openDocument]
    );

    const handleScroll = () => {
        browserContextMenu.close();
        browserItemContextMenu.close();
    };

    useEffect(() => {
        browserContextMenu.close();
        browserItemContextMenu.close();
    }, [shareId, linkId]);

    if (!browserItems.length && !isLoading) {
        if (!permissions.canEdit) {
            return <EmptyDeviceRoot />;
        }

        return <EmptyFolder shareId={shareId} linkId={linkId} volumeId={volumeId} />;
    }

    const Cells = viewportWidth['>=large'] ? myFilesLargeScreenCells : myFilesSmallScreenCells;
    const headerItems = viewportWidth['>=large'] ? headerItemsLargeScreen : headerItemsSmallScreen;

    return (
        <>
            <FolderContextMenu
                volumeId={volumeId}
                shareId={shareId}
                linkId={linkId}
                anchorRef={contextMenuAnchorRef}
                close={browserContextMenu.close}
                isOpen={browserContextMenu.isOpen}
                open={browserContextMenu.open}
                position={browserContextMenu.position}
            />
            <FolderItemContextMenu
                volumeId={volumeId}
                shareId={shareId}
                linkId={linkId}
                selectedItems={selectedItems}
                anchorRef={contextMenuAnchorRef}
                close={browserItemContextMenu.close}
                isOpen={browserItemContextMenu.isOpen}
                open={browserItemContextMenu.open}
                position={browserItemContextMenu.position}
            />
            <FileBrowser
                // data
                caption={folder?.name}
                headerItems={headerItems}
                items={browserItems}
                layout={layout}
                loading={isLoading}
                sortParams={sortParams}
                // components
                Cells={Cells}
                GridHeaderComponent={GridHeaderComponent}
                GridViewItem={GridViewItem}
                // handlers
                onItemOpen={handleClick}
                contextMenuAnchorRef={contextMenuAnchorRef}
                onItemContextMenu={browserItemContextMenu.handleContextMenu}
                onItemRender={handleItemRender}
                onSort={setSorting}
                onScroll={handleScroll}
                onViewContextMenu={browserContextMenu.handleContextMenu}
                getDragMoveControls={permissions.canEdit ? getDragMoveControls : undefined}
            />
            {linkSharingModal}
        </>
    );
}
