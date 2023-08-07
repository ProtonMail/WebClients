import { useCallback, useMemo, useRef } from 'react';

import { c } from 'ttag';

import { useActiveBreakpoint } from '@proton/components';

import useNavigate from '../../../hooks/drive/useNavigate';
import { EncryptedLink, LinkShareUrl, useThumbnailsDownload } from '../../../store';
import { useTrashView } from '../../../store';
import { SortField } from '../../../store/_views/utils/useSorting';
import FileBrowser, { Cells, GridHeader, useItemContextMenu, useSelection } from '../../FileBrowser';
import { BrowserItemId, FileBrowserBaseItem, ListViewHeaderItem } from '../../FileBrowser/interface';
import { GridViewItem } from '../FileBrowser/GridViewItemLink';
import { DeletedCell, LocationCell, NameCell, SizeCell } from '../FileBrowser/contentCells';
import headerItems from '../FileBrowser/headerCells';
import { translateSortField } from '../SortDropdown';
import { getSelectedItems } from '../helpers';
import EmptyTrash from './EmptyTrash';
import { TrashItemContextMenu } from './TrashItemContextMenu';

export interface TrashItem extends FileBrowserBaseItem {
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
    rootShareId: string;
    corruptedLink?: boolean;
}
interface Props {
    shareId: string;
    trashView: ReturnType<typeof useTrashView>;
}

const { CheckboxCell, ContextMenuCell } = Cells;

const desktopCells: React.FC<{ item: TrashItem }>[] = [
    CheckboxCell,
    NameCell,
    LocationCell,
    DeletedCell,
    SizeCell,
    ContextMenuCell,
];
const mobileCells = [CheckboxCell, NameCell, LocationCell, SizeCell, ContextMenuCell];

const headerItemsDesktop: ListViewHeaderItem[] = [
    headerItems.checkbox,
    headerItems.name,
    headerItems.location,
    headerItems.trashed,
    headerItems.size,
    headerItems.placeholder,
];

const headeItemsMobile: ListViewHeaderItem[] = [
    headerItems.checkbox,
    headerItems.name,
    headerItems.location,
    headerItems.size,
    headerItems.placeholder,
];

type TrashSortFields = Extract<SortField, SortField.name | SortField.size | SortField.trashed>;
const SORT_FIELDS: TrashSortFields[] = [SortField.name, SortField.trashed, SortField.size];

function Trash({ trashView }: Props) {
    const contextMenuAnchorRef = useRef<HTMLDivElement>(null);

    const { navigateToLink } = useNavigate();
    const browserItemContextMenu = useItemContextMenu();
    const thumbnails = useThumbnailsDownload();
    const selectionControls = useSelection();
    const { isDesktop } = useActiveBreakpoint();

    const { layout, items, sortParams, setSorting, isLoading } = trashView;

    const selectedItems = useMemo(
        () => getSelectedItems(items, selectionControls!.selectedItemIds),
        [items, selectionControls!.selectedItemIds]
    );

    const browserItems: TrashItem[] = items.map((item) => ({ ...item, id: item.linkId }));

    const handleClick = useCallback(
        (id: BrowserItemId) => {
            const item = browserItems.find((item) => item.id === id);

            if (!item) {
                return;
            }
            document.getSelection()?.removeAllRanges();
            if (!item.isFile) {
                return;
            }
            navigateToLink(item.rootShareId, id, item.isFile);
        },
        [navigateToLink, browserItems]
    );

    const handleItemRender = useCallback((item: TrashItem) => {
        if (item.hasThumbnail && item.activeRevision && !item.cachedThumbnailUrl) {
            thumbnails.addToDownloadQueue(item.rootShareId, item.id, item.activeRevision.id);
        }
    }, []);

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

    if (!items.length && !isLoading) {
        return <EmptyTrash />;
    }

    const Cells = isDesktop ? desktopCells : mobileCells;
    const headerItems = isDesktop ? headerItemsDesktop : headeItemsMobile;

    return (
        <>
            <TrashItemContextMenu
                selectedLinks={selectedItems}
                anchorRef={contextMenuAnchorRef}
                close={browserItemContextMenu.close}
                isOpen={browserItemContextMenu.isOpen}
                open={browserItemContextMenu.open}
                position={browserItemContextMenu.position}
            />
            <FileBrowser
                caption={c('Title').t`Trash`}
                items={browserItems}
                headerItems={headerItems}
                layout={layout}
                loading={isLoading}
                sortParams={sortParams}
                Cells={Cells}
                GridHeaderComponent={GridHeaderComponent}
                GridViewItem={GridViewItem}
                onItemOpen={handleClick}
                contextMenuAnchorRef={contextMenuAnchorRef}
                onItemContextMenu={browserItemContextMenu.handleContextMenu}
                onItemRender={handleItemRender}
                onSort={setSorting}
                onScroll={browserItemContextMenu.close}
            />
        </>
    );
}

export default Trash;
