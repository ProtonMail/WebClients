import { useCallback, useMemo, useRef } from 'react';

import { c } from 'ttag';

import { useActiveBreakpoint } from '@proton/components';
import { SHARE_MEMBER_PERMISSIONS } from '@proton/shared/lib/drive/permissions';
import { isProtonDocument } from '@proton/shared/lib/helpers/mimetype';

import useDriveDragMove from '../../../hooks/drive/useDriveDragMove';
import useNavigate from '../../../hooks/drive/useNavigate';
import type { EncryptedLink, LinkShareUrl, useSearchView } from '../../../store';
import { useThumbnailsDownload } from '../../../store';
import { useDocumentActions, useDriveDocsFeatureFlag } from '../../../store/_documents';
import { SortField } from '../../../store/_views/utils/useSorting';
import { sendErrorReport } from '../../../utils/errorHandling';
import FileBrowser, { Cells, GridHeader, useItemContextMenu, useSelection } from '../../FileBrowser';
import type { BrowserItemId, FileBrowserBaseItem, ListViewHeaderItem } from '../../FileBrowser/interface';
import { GridViewItem } from '../FileBrowser/GridViewItemLink';
import { LocationCell, ModifiedCell, NameCell, SizeCell } from '../FileBrowser/contentCells';
import headerItems from '../FileBrowser/headerCells';
import { translateSortField } from '../SortDropdown';
import { getSelectedItems } from '../helpers';
import { NoSearchResultsView } from './NoSearchResultsView';
import { SearchItemContextMenu } from './SearchItemContextMenu';

interface SearchItem extends FileBrowserBaseItem {
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
    isShared: boolean;
    isAdmin: boolean;
}

interface Props {
    shareId: string;
    searchView: ReturnType<typeof useSearchView>;
}

const { CheckboxCell, ContextMenuCell } = Cells;

const largeScreenCells: React.FC<{ item: SearchItem }>[] = [
    CheckboxCell,
    NameCell,
    LocationCell,
    ModifiedCell,
    SizeCell,
    ContextMenuCell,
];
const smallScreenCells = [CheckboxCell, NameCell, ContextMenuCell];

const headerItemsLargeScreen: ListViewHeaderItem[] = [
    headerItems.checkbox,
    headerItems.name,
    headerItems.location,
    headerItems.modificationDate,
    headerItems.size,
    headerItems.placeholder,
];

const headerItemsSmallScreen: ListViewHeaderItem[] = [headerItems.checkbox, headerItems.name, headerItems.placeholder];

type SearchSortFields = Extract<SortField, SortField.name | SortField.fileModifyTime | SortField.size>;
const SORT_FIELDS: SearchSortFields[] = [SortField.name, SortField.size, SortField.fileModifyTime];

export const Search = ({ shareId, searchView }: Props) => {
    const contextMenuAnchorRef = useRef<HTMLDivElement>(null);

    const browserItemContextMenu = useItemContextMenu();
    const thumbnails = useThumbnailsDownload();
    const { navigateToLink } = useNavigate();
    const selectionControls = useSelection();
    const { viewportWidth } = useActiveBreakpoint();
    const { openDocument } = useDocumentActions();
    const { canUseDocs } = useDriveDocsFeatureFlag();

    const { layout, items, sortParams, setSorting, isLoading } = searchView;

    const selectedItems = useMemo(
        () => getSelectedItems(items, selectionControls!.selectedItemIds),
        [items, selectionControls!.selectedItemIds]
    );

    // We consider that search is limited to items you own for now
    const browserItems: SearchItem[] = items.map((item) => ({ ...item, id: item.linkId, isAdmin: true }));
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

    const handleItemRender = (item: SearchItem) => {
        if (item.hasThumbnail && item.activeRevision && !item.cachedThumbnailUrl) {
            thumbnails.addToDownloadQueue(item.rootShareId, item.id, item.activeRevision.id);
        }
    };

    const handleClick = useCallback(
        (id: BrowserItemId) => {
            const item = browserItems.find((item) => item.id === id);

            if (!item) {
                return;
            }

            if (isProtonDocument(item.mimeType)) {
                void canUseDocs(shareId)
                    .then((canUse) => {
                        if (!canUse) {
                            return;
                        }

                        return openDocument({
                            linkId: id,
                            shareId,
                            openBehavior: 'tab',
                        });
                    })
                    .catch(sendErrorReport);
                return;
            }

            document.getSelection()?.removeAllRanges();
            navigateToLink(shareId, item.linkId, item.isFile);
        },
        [navigateToLink, shareId, browserItems]
    );

    const Cells = viewportWidth['>=large'] ? largeScreenCells : smallScreenCells;
    const headerItems = viewportWidth['>=large'] ? headerItemsLargeScreen : headerItemsSmallScreen;

    if (!items.length && !isLoading) {
        return <NoSearchResultsView />;
    }
    return (
        <>
            <SearchItemContextMenu
                permissions={SHARE_MEMBER_PERMISSIONS.OWNER} // TODO: Permissions is not supported on search for now
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
