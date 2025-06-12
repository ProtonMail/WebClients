import { useCallback, useMemo, useRef } from 'react';

import { c } from 'ttag';

import { useActiveBreakpoint } from '@proton/components';
import { isProtonDocsDocument, isProtonDocsSpreadsheet } from '@proton/shared/lib/helpers/mimetype';

import useDriveNavigation from '../../../hooks/drive/useNavigate';
import { useOnItemRenderedMetrics } from '../../../hooks/drive/useOnItemRenderedMetrics';
import type { EncryptedLink, LinkShareUrl, SignatureIssues } from '../../../store';
import { useThumbnailsDownload } from '../../../store';
import type { useTrashView } from '../../../store';
import { useDocumentActions, useDriveDocsFeatureFlag } from '../../../store/_documents';
import { SortField } from '../../../store/_views/utils/useSorting';
import FileBrowser, { Cells, GridHeader, useItemContextMenu, useSelection } from '../../FileBrowser';
import type { BrowserItemId, FileBrowserBaseItem, ListViewHeaderItem } from '../../FileBrowser/interface';
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
    signatureIssues?: SignatureIssues;
    signatureEmail?: string;
    size: number;
    trashed: number | null;
    parentLinkId: string;
    rootShareId: string;
    sharedOn?: number;
}
interface Props {
    shareId: string;
    trashView: ReturnType<typeof useTrashView>;
}

const { CheckboxCell, ContextMenuCell } = Cells;

const largeScreenCells: React.FC<{ item: TrashItem }>[] = [
    CheckboxCell,
    NameCell,
    LocationCell,
    DeletedCell,
    SizeCell,
    ContextMenuCell,
];
const smallScreenCells = [CheckboxCell, NameCell, LocationCell, SizeCell, ContextMenuCell];

const headerItemsLargeScreen: ListViewHeaderItem[] = [
    headerItems.checkbox,
    headerItems.name,
    headerItems.location,
    headerItems.trashed,
    headerItems.size,
    headerItems.placeholder,
];

const headerItemsSmallScreen: ListViewHeaderItem[] = [
    headerItems.checkbox,
    headerItems.name,
    headerItems.location,
    headerItems.size,
    headerItems.placeholder,
];

type TrashSortFields = Extract<SortField, SortField.name | SortField.size | SortField.trashed>;
const SORT_FIELDS: TrashSortFields[] = [SortField.name, SortField.trashed, SortField.size];

function Trash({ trashView, shareId }: Props) {
    const contextMenuAnchorRef = useRef<HTMLDivElement>(null);

    const { navigateToLink } = useDriveNavigation();
    const browserItemContextMenu = useItemContextMenu();
    const thumbnails = useThumbnailsDownload();
    const selectionControls = useSelection();
    const { viewportWidth } = useActiveBreakpoint();
    const { isDocsEnabled } = useDriveDocsFeatureFlag();
    const { openDocument } = useDocumentActions();
    const { incrementItemRenderedCounter } = useOnItemRenderedMetrics(trashView.layout, trashView.isLoading);

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

            if (isProtonDocsDocument(item.mimeType)) {
                if (isDocsEnabled) {
                    return openDocument({
                        type: 'doc',
                        linkId: id,
                        shareId,
                        openBehavior: 'tab',
                    });
                }
                return;
            } else if (isProtonDocsSpreadsheet(item.mimeType)) {
                if (isDocsEnabled) {
                    return openDocument({
                        type: 'sheet',
                        linkId: id,
                        shareId,
                        openBehavior: 'tab',
                    });
                }
                return;
            }

            if (!item.isFile) {
                return;
            }
            // Opening a file preview opens the file in the context of folder.
            // For photos in the photo stream, it is fine as it is regular folder.
            // But photos in albums only (uploaded by other users) are not in the
            // context of folder and it requires dedicated album endpoints to load
            // "folder". We do not support this in regular preview, so the easiest
            // is to disable opening preview for such a link.
            // In the future, ideally we want trash of photos to separate to own
            // screen or app, then it will not be a problem. In mid-term, we want
            // to open preview without folder context - that is to not redirect to
            // FolderContainer, but open preview on the same page. That will also
            // fix the problem with returning back to trash and stay on the same
            // place in the view.
            if (item.photoProperties?.albums.some((album) => album.albumLinkId === item.parentLinkId)) {
                return;
            }
            navigateToLink(item.rootShareId, id, item.isFile);
        },
        [navigateToLink, browserItems, isDocsEnabled, openDocument]
    );

    const handleItemRender = useCallback(
        (item: TrashItem) => {
            incrementItemRenderedCounter();
            if (item.hasThumbnail && item.activeRevision && !item.cachedThumbnailUrl) {
                thumbnails.addToDownloadQueue(item.rootShareId, item.linkId, item.activeRevision.id);
            }
        },
        [thumbnails, incrementItemRenderedCounter]
    );

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

    const Cells = viewportWidth['>=large'] ? largeScreenCells : smallScreenCells;
    const headerItems = viewportWidth['>=large'] ? headerItemsLargeScreen : headerItemsSmallScreen;

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
