import { useCallback, useEffect, useMemo, useRef } from 'react';

import { useActiveBreakpoint } from '@proton/components';

import { EncryptedLink, LinkShareUrl, useFolderView, useThumbnailsDownload } from '../../../store';
import useNavigate from '../../../hooks/drive/useNavigate';
import FileBrowser, {
    Cells,
    useSelection,
    GridHeader,
    useItemContextMenu,
    useContextMenuControls,
} from '../../FileBrowser';
import { DriveFolder } from '../../../hooks/drive/useActiveShare';
import EmptyFolder from './EmptyFolder';
import { DriveItemContextMenu } from './DriveContextMenu';
import useOpenModal from '../../useOpenModal';
import { BrowserItemId, FileBrowserBaseItem, ListViewHeaderItem } from '../../FileBrowser/interface';
import { ModifiedCell, NameCell, SizeCell, ShareOptionsCell } from '../FileBrowser/contentCells';
import { FolderContextMenu } from './FolderContextMenu';
import useDriveDragMove from '../../../hooks/drive/useDriveDragMove';
import { GridViewItem } from '../FileBrowser/GridViewItem';
import headerItems from '../FileBrowser/headerCells';
import { getSelectedItems } from '../helpers';
import { SortField } from '../../../store/_views/utils/useSorting';
import { translateSortField } from '../SortDropdown';

export interface DriveItem extends FileBrowserBaseItem {
    activeRevision?: EncryptedLink['activeRevision'];
    cachedThumbnailUrl?: string;
    hasThumbnail: boolean;
    isFile: boolean;
    mimeType: string;
    fileModifyTime: number;
    name: string;
    shareUrl?: LinkShareUrl;
    signatureIssues?: any;
    size: number;
    trashed: number | null;
    parentLinkId: string;
}

interface Props {
    activeFolder: DriveFolder;
    folderView: ReturnType<typeof useFolderView>;
}

const { CheckboxCell, ContextMenuCell } = Cells;

const myFilesDesktopCells: React.FC<{ item: DriveItem }>[] = [
    CheckboxCell,
    NameCell,
    ModifiedCell,
    SizeCell,
    ShareOptionsCell,
    ContextMenuCell,
];
const myFilesMobileCells = [CheckboxCell, NameCell, ContextMenuCell];

const headerItemsDesktop: ListViewHeaderItem[] = [
    headerItems.checkbox,
    headerItems.name,
    headerItems.modificationDate,
    headerItems.size,
    headerItems.placeholder,
    headerItems.placeholder,
];

const headerItemsMobile: ListViewHeaderItem[] = [headerItems.checkbox, headerItems.name, headerItems.placeholder];

type DriveSortFields = Extract<SortField, SortField.name | SortField.fileModifyTime | SortField.size>;
const SORT_FIELDS: DriveSortFields[] = [SortField.name, SortField.fileModifyTime, SortField.size];

function Drive({ activeFolder, folderView }: Props) {
    const { shareId, linkId } = activeFolder;
    const contextMenuAnchorRef = useRef<HTMLDivElement>(null);

    const browserContextMenu = useContextMenuControls();
    const browserItemContextMenu = useItemContextMenu();
    const thumbnails = useThumbnailsDownload();
    const { navigateToLink } = useNavigate();
    const selectionControls = useSelection();
    const { isDesktop } = useActiveBreakpoint();

    const { layout, folderName, items, sortParams, setSorting, isLoading } = folderView;

    const selectedItems = useMemo(
        () => getSelectedItems(items, selectionControls!.selectedItemIds),
        [items, selectionControls!.selectedItemIds]
    );

    const { openPreview } = useOpenModal();
    const browserItems: DriveItem[] = items.map((item) => ({ ...item, id: item.linkId }));
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
                        onToggleAllSelected={selectionControls!.toggleAllSelected}
                        scrollAreaRef={scrollAreaRef}
                        activeSortingText={activeSortingText}
                    />
                );
            },
        [sortParams.sortField, sortParams.sortOrder, isLoading]
    );

    const handleItemRender = useCallback(
        (item: DriveItem) => {
            if (item.hasThumbnail && item.activeRevision && !item.cachedThumbnailUrl) {
                thumbnails.addToDownloadQueue(shareId, item.id, item.activeRevision.id);
            }
        },
        [items]
    );

    const handleClick = useCallback(
        (id: BrowserItemId) => {
            const item = browserItems.find((item) => item.id === id);

            if (!item) {
                return;
            }
            document.getSelection()?.removeAllRanges();
            if (item.isFile) {
                openPreview(shareId, id);
                return;
            }
            navigateToLink(shareId, id, item.isFile);
        },
        [navigateToLink, shareId, browserItems]
    );

    const handleScroll = () => {
        browserContextMenu.close();
        browserItemContextMenu.close();
    };

    useEffect(() => {
        browserContextMenu.resetPosition();
        browserItemContextMenu.resetPosition();
    }, [shareId, linkId]);

    if (!items.length && !isLoading) {
        return <EmptyFolder shareId={shareId} />;
    }

    const Cells = isDesktop ? myFilesDesktopCells : myFilesMobileCells;
    const headerItems = isDesktop ? headerItemsDesktop : headerItemsMobile;

    return (
        <>
            <FolderContextMenu
                shareId={shareId}
                anchorRef={contextMenuAnchorRef}
                close={browserContextMenu.close}
                isOpen={browserContextMenu.isOpen}
                open={browserContextMenu.open}
                position={browserContextMenu.position}
            />
            <DriveItemContextMenu
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
                getDragMoveControls={getDragMoveControls}
            />
        </>
    );
}

export default Drive;
