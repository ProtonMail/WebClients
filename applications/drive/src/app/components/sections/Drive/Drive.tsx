import { useCallback, useEffect, useMemo, useRef } from 'react';

import { useActiveBreakpoint } from '@proton/components';
import { generateNodeUid } from '@proton/drive/index';
import { getCanAdmin } from '@proton/shared/lib/drive/permissions';
import { isProtonDocsDocument, isProtonDocsSpreadsheet } from '@proton/shared/lib/helpers/mimetype';

import type { DriveFolder } from '../../../hooks/drive/useActiveShare';
import useDriveDragMove from '../../../hooks/drive/useDriveDragMove';
import useDriveNavigation from '../../../hooks/drive/useNavigate';
import { useOnItemRenderedMetrics } from '../../../hooks/drive/useOnItemRenderedMetrics';
import { useSharingModal } from '../../../modals/SharingModal/SharingModal';
import type { EncryptedLink, LinkShareUrl, SignatureIssues, useFolderView } from '../../../store';
import { useThumbnailsDownload } from '../../../store';
import { useDocumentActions, useDriveDocsFeatureFlag } from '../../../store/_documents';
import { SortField } from '../../../store/_views/utils/useSorting';
import FileBrowser, {
    Cells,
    GridHeader,
    useContextMenuControls,
    useItemContextMenu,
    useSelection,
} from '../../FileBrowser';
import type { BrowserItemId, FileBrowserBaseItem, ListViewHeaderItem } from '../../FileBrowser/interface';
import useOpenPreview from '../../useOpenPreview';
import { GridViewItem } from '../FileBrowser/GridViewItemLink';
import { ModifiedCell, NameCell, ShareOptionsCell, SizeCell } from '../FileBrowser/contentCells';
import headerItems from '../FileBrowser/headerCells';
import { translateSortField } from '../SortDropdown';
import { getSelectedItems } from '../helpers';
import { DriveItemContextMenu } from './DriveContextMenu';
import EmptyDeviceRoot from './EmptyDeviceRoot';
import EmptyFolder from './EmptyFolder';
import { FolderContextMenu } from './FolderContextMenu';

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
    showLinkSharingModal?: ReturnType<typeof useSharingModal>['showSharingModal'];
    volumeId: string;
}

interface Props {
    activeFolder: DriveFolder;
    folderView: ReturnType<typeof useFolderView>;
}

const { CheckboxCell, ContextMenuCell } = Cells;

const myFilesLargeScreenCells: React.FC<{ item: DriveItem }>[] = [
    CheckboxCell,
    NameCell,
    ModifiedCell,
    SizeCell,
    ShareOptionsCell,
    ContextMenuCell,
];
const myFilesSmallScreenCells = [CheckboxCell, NameCell, ContextMenuCell];

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

function Drive({ activeFolder, folderView }: Props) {
    const { shareId, linkId } = activeFolder;
    const contextMenuAnchorRef = useRef<HTMLDivElement>(null);

    const browserContextMenu = useContextMenuControls();
    const browserItemContextMenu = useItemContextMenu();
    const thumbnails = useThumbnailsDownload();
    const { navigateToLink } = useDriveNavigation();
    const selectionControls = useSelection();
    const { viewportWidth } = useActiveBreakpoint();
    const { openDocument } = useDocumentActions();
    const { isDocsEnabled } = useDriveDocsFeatureFlag();
    const { sharingModal, showSharingModal } = useSharingModal();
    const { incrementItemRenderedCounter } = useOnItemRenderedMetrics(folderView.layout, folderView.isLoading);
    const { permissions, layout, folderName, items, sortParams, setSorting, isLoading } = folderView;
    const isAdmin = useMemo(() => getCanAdmin(permissions), [permissions]);

    const selectedItems = useMemo(
        () => getSelectedItems(items, selectionControls?.selectedItemIds || []),
        [items, selectionControls?.selectedItemIds]
    );

    const openPreview = useOpenPreview();

    const browserItems: DriveItem[] = items.map((item) => ({
        ...item,
        id: item.linkId,
        // TODO: Improve this, we should not pass showLinkSharingModal here
        onShareClick: item.isShared
            ? () => showSharingModal({ nodeUid: generateNodeUid(item.volumeId, item.linkId) })
            : undefined,
        isAdmin,
    }));
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
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
        (item: DriveItem) => {
            incrementItemRenderedCounter();

            if (item.hasThumbnail && item.activeRevision && !item.cachedThumbnailUrl) {
                thumbnails.addToDownloadQueue(shareId, item.linkId, item.activeRevision.id);
            }
        },
        [thumbnails, shareId, incrementItemRenderedCounter]
    );

    const handleClick = useCallback(
        (id: BrowserItemId) => {
            const item = browserItems.find((item) => item.id === id);

            if (!item) {
                return;
            }
            document.getSelection()?.removeAllRanges();

            if (isProtonDocsDocument(item.mimeType)) {
                if (isDocsEnabled) {
                    return openDocument({
                        type: 'doc',
                        linkId: item.linkId,
                        shareId,
                        openBehavior: 'tab',
                    });
                }
                return;
            } else if (isProtonDocsSpreadsheet(item.mimeType)) {
                if (isDocsEnabled) {
                    return openDocument({
                        type: 'sheet',
                        linkId: item.linkId,
                        shareId,
                        openBehavior: 'tab',
                    });
                }
                return;
            }

            if (item.isFile) {
                openPreview(shareId, id);
                return;
            }
            navigateToLink(shareId, id, item.isFile);
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

    if (!items.length && !isLoading) {
        if (folderView.isActiveLinkReadOnly) {
            return <EmptyDeviceRoot />;
        }

        return (
            <EmptyFolder shareId={shareId} permissions={permissions} isRoot={folderView.isActiveLinkRoot ?? false} />
        );
    }

    const Cells = viewportWidth['>=large'] ? myFilesLargeScreenCells : myFilesSmallScreenCells;
    const headerItems = viewportWidth['>=large'] ? headerItemsLargeScreen : headerItemsSmallScreen;

    return (
        <>
            <FolderContextMenu
                permissions={permissions}
                isActiveLinkReadOnly={folderView.isActiveLinkReadOnly}
                isActiveLinkRoot={folderView.isActiveLinkRoot}
                isActiveLinkInDeviceShare={folderView.isActiveLinkInDeviceShare}
                shareId={shareId}
                anchorRef={contextMenuAnchorRef}
                close={browserContextMenu.close}
                isOpen={browserContextMenu.isOpen}
                open={browserContextMenu.open}
                position={browserContextMenu.position}
            />
            <DriveItemContextMenu
                permissions={permissions}
                isActiveLinkReadOnly={folderView.isActiveLinkReadOnly}
                shareId={shareId}
                selectedLinks={selectedItems}
                anchorRef={contextMenuAnchorRef}
                close={browserItemContextMenu.close}
                isOpen={browserItemContextMenu.isOpen}
                open={browserItemContextMenu.open}
                position={browserItemContextMenu.position}
            />
            <FileBrowser
                // data
                caption={folderName}
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
                getDragMoveControls={folderView.isActiveLinkReadOnly ? undefined : getDragMoveControls}
            />
            {sharingModal}
        </>
    );
}

export default Drive;
