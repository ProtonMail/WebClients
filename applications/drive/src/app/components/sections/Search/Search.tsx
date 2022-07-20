import { useCallback, useMemo, useRef } from 'react';
import { c } from 'ttag';

import { useActiveBreakpoint } from '@proton/components';

import { EncryptedLink, LinkShareUrl, useSearchView, useThumbnailsDownload } from '../../../store';
import useNavigate from '../../../hooks/drive/useNavigate';
import FileBrowser, { GridHeader, Cells, useItemContextMenu, useSelection } from '../../FileBrowser';
import { SearchItemContextMenu } from './SearchItemContextMenu';
import headerItems from '../FileBrowser/headerCells';
import { LocationCell, ModifiedCell, NameCell, SizeCell } from '../FileBrowser/contentCells';
import { BrowserItemId, FileBrowserBaseItem, ListViewHeaderItem } from '../../FileBrowser/interface';
import useDriveDragMove from '../../../hooks/drive/useDriveDragMove';
import { GridViewItem } from '../FileBrowser/GridViewItem';
import { getSelectedItems } from '../helpers';
import { SortField } from '../../../store/_views/utils/useSorting';
import { translateSortField } from '../SortDropdown';

export interface SearchItem extends FileBrowserBaseItem {
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
    shareId: string;
    searchView: ReturnType<typeof useSearchView>;
}

const { CheckboxCell, ContextMenuCell } = Cells;

const desktopCells: React.FC<{ item: SearchItem }>[] = [
    CheckboxCell,
    NameCell,
    LocationCell,
    ModifiedCell,
    SizeCell,
    ContextMenuCell,
];
const mobileCells = [CheckboxCell, NameCell, ContextMenuCell];

const headerItemsDesktop: ListViewHeaderItem[] = [
    headerItems.checkbox,
    headerItems.name,
    headerItems.location,
    headerItems.modificationDate,
    headerItems.size,
    headerItems.placeholder,
];

const headerItemsMobile: ListViewHeaderItem[] = [headerItems.checkbox, headerItems.name, headerItems.placeholder];

type SearchSortFields = Extract<SortField, SortField.name | SortField.fileModifyTime | SortField.size>;
const SORT_FIELDS: SearchSortFields[] = [SortField.name, SortField.size, SortField.fileModifyTime];

export const Search = ({ shareId, searchView }: Props) => {
    const contextMenuAnchorRef = useRef<HTMLDivElement>(null);

    const browserItemContextMenu = useItemContextMenu();
    const thumbnails = useThumbnailsDownload();
    const { navigateToLink } = useNavigate();
    const selectionControls = useSelection();
    const { isDesktop } = useActiveBreakpoint();

    const { layout, items, sortParams, setSorting, isLoading } = searchView;

    const selectedItems = useMemo(
        () => getSelectedItems(items, selectionControls!.selectedItemIds),
        [items, selectionControls!.selectedItemIds]
    );

    const browserItems: SearchItem[] = items.map((item) => ({ ...item, id: item.linkId }));
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

    const handleItemRender = useCallback((item: SearchItem) => {
        if (item.hasThumbnail && item.activeRevision && !item.cachedThumbnailUrl) {
            thumbnails.addToDownloadQueue(shareId, item.id, item.activeRevision.id);
        }
    }, []);

    const handleClick = useCallback(
        (id: BrowserItemId) => {
            const item = browserItems.find((item) => item.id === id);

            if (!item) {
                return;
            }
            document.getSelection()?.removeAllRanges();
            navigateToLink(shareId, item.id, item.isFile);
        },
        [navigateToLink, shareId, browserItems]
    );

    const Cells = isDesktop ? desktopCells : mobileCells;
    const headerItems = isDesktop ? headerItemsDesktop : headerItemsMobile;

    return (
        <>
            <SearchItemContextMenu
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
                caption={c('Title').t`Search results`}
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
                onScroll={browserItemContextMenu.close}
                getDragMoveControls={getDragMoveControls}
            />
        </>
    );
};
