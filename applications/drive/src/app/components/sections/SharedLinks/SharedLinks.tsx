import { useCallback, useMemo, useRef } from 'react';

import { c } from 'ttag';

import { useActiveBreakpoint } from '@proton/components';

import useNavigate from '../../../hooks/drive/useNavigate';
import { EncryptedLink, LinkShareUrl, useSharedLinksView, useThumbnailsDownload } from '../../../store';
import { SortField } from '../../../store/_views/utils/useSorting';
import FileBrowser, {
    BrowserItemId,
    Cells,
    FileBrowserBaseItem,
    GridHeader,
    ListViewHeaderItem,
    useItemContextMenu,
    useSelection,
} from '../../FileBrowser';
import { GridViewItem } from '../FileBrowser/GridViewItemLink';
import { AccessCountCell, CreatedCell, ExpirationCell, LocationCell, NameCell } from '../FileBrowser/contentCells';
import headerItems from '../FileBrowser/headerCells';
import { translateSortField } from '../SortDropdown';
import { getSelectedItems } from '../helpers';
import EmptyShared from './EmptyShared';
import { SharedLinksItemContextMenu } from './SharedLinksItemContextMenu';

export interface SharedLinkItem extends FileBrowserBaseItem {
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

type Props = {
    shareId: string;
    sharedLinksView: ReturnType<typeof useSharedLinksView>;
};

const { CheckboxCell, ContextMenuCell } = Cells;

const desktopCells: React.FC<{ item: SharedLinkItem }>[] = [
    CheckboxCell,
    NameCell,
    LocationCell,
    CreatedCell,
    AccessCountCell,
    ExpirationCell,
    ContextMenuCell,
];
const mobileCells = [CheckboxCell, NameCell, LocationCell, ExpirationCell, ContextMenuCell];

const headerItemsDesktop: ListViewHeaderItem[] = [
    headerItems.checkbox,
    headerItems.name,
    headerItems.location,
    headerItems.creationDate,
    headerItems.accessCount,
    headerItems.expirationDate,
    headerItems.placeholder,
];

const headeItemsMobile: ListViewHeaderItem[] = [
    headerItems.checkbox,
    headerItems.name,
    headerItems.location,
    headerItems.expirationDate,
    headerItems.placeholder,
];
type SharedLinksSortFields = Extract<
    SortField,
    SortField.name | SortField.linkCreateTime | SortField.linkExpireTime | SortField.numAccesses
>;
const SORT_FIELDS: SharedLinksSortFields[] = [
    SortField.name,
    SortField.linkCreateTime,
    SortField.linkExpireTime,
    SortField.numAccesses,
];

const SharedLinks = ({ shareId, sharedLinksView }: Props) => {
    const contextMenuAnchorRef = useRef<HTMLDivElement>(null);

    const { navigateToLink } = useNavigate();
    const browserItemContextMenu = useItemContextMenu();
    const thumbnails = useThumbnailsDownload();
    const selectionControls = useSelection();
    const { isDesktop } = useActiveBreakpoint();

    const { layout, items, sortParams, setSorting, isLoading } = sharedLinksView;

    const selectedItems = useMemo(
        () => getSelectedItems(items, selectionControls!.selectedItemIds),
        [items, selectionControls!.selectedItemIds]
    );

    const browserItems: SharedLinkItem[] = items.map((item) => ({ ...item, id: item.linkId }));

    const handleClick = useCallback(
        (id: BrowserItemId) => {
            const item = browserItems.find((item) => item.id === id);

            if (!item) {
                return;
            }
            document.getSelection()?.removeAllRanges();
            navigateToLink(item.rootShareId, item.id, item.isFile);
        },
        [navigateToLink, shareId, browserItems]
    );

    const handleItemRender = useCallback((item: SharedLinkItem) => {
        if (item.hasThumbnail && item.activeRevision && !item.cachedThumbnailUrl) {
            thumbnails.addToDownloadQueue(shareId, item.id, item.activeRevision.id);
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
        return <EmptyShared shareId={shareId} />;
    }

    const Cells = isDesktop ? desktopCells : mobileCells;
    const headerItems = isDesktop ? headerItemsDesktop : headeItemsMobile;

    return (
        <>
            <SharedLinksItemContextMenu
                selectedLinks={selectedItems}
                anchorRef={contextMenuAnchorRef}
                close={browserItemContextMenu.close}
                isOpen={browserItemContextMenu.isOpen}
                open={browserItemContextMenu.open}
                position={browserItemContextMenu.position}
            />
            <FileBrowser
                caption={c('Title').t`Shared`}
                items={browserItems}
                headerItems={headerItems}
                layout={layout}
                loading={isLoading}
                sortParams={sortParams}
                Cells={Cells}
                GridHeaderComponent={GridHeaderComponent}
                GridViewItem={GridViewItem}
                contextMenuAnchorRef={contextMenuAnchorRef}
                onItemContextMenu={browserItemContextMenu.handleContextMenu}
                onItemOpen={handleClick}
                onItemRender={handleItemRender}
                onSort={setSorting}
                onScroll={browserItemContextMenu.close}
            />
        </>
    );
};

export default SharedLinks;
