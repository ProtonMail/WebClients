import { useCallback, useMemo, useRef } from 'react';

import { c } from 'ttag';

import { useActiveBreakpoint } from '@proton/components';
import { isProtonDocument } from '@proton/shared/lib/helpers/mimetype';

import useNavigate from '../../../hooks/drive/useNavigate';
import type { EncryptedLink, LinkShareUrl, useSharedLinksView } from '../../../store';
import { useThumbnailsDownload } from '../../../store';
import { useDocumentActions, useDriveDocsFeatureFlag } from '../../../store/_documents';
import { SortField } from '../../../store/_views/utils/useSorting';
import { sendErrorReport } from '../../../utils/errorHandling';
import type { BrowserItemId, FileBrowserBaseItem, ListViewHeaderItem } from '../../FileBrowser';
import FileBrowser, { Cells, GridHeader, useItemContextMenu, useSelection } from '../../FileBrowser';
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
    sharedOn?: number;
}

type Props = {
    shareId: string;
    sharedLinksView: ReturnType<typeof useSharedLinksView>;
};

const { CheckboxCell, ContextMenuCell } = Cells;

const largeScreenCells: React.FC<{ item: SharedLinkItem }>[] = [
    CheckboxCell,
    NameCell,
    LocationCell,
    CreatedCell,
    AccessCountCell,
    ExpirationCell,
    ContextMenuCell,
];
const smallScreenCells = [CheckboxCell, NameCell, LocationCell, ExpirationCell, ContextMenuCell];

const headerItemsLargeScreen: ListViewHeaderItem[] = [
    headerItems.checkbox,
    headerItems.name,
    headerItems.location,
    headerItems.creationDate,
    headerItems.accessCount,
    headerItems.expirationDate,
    headerItems.placeholder,
];

const headerItemsSmallScreen: ListViewHeaderItem[] = [
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
    const { viewportWidth } = useActiveBreakpoint();
    const { openDocument } = useDocumentActions();
    const { canUseDocs } = useDriveDocsFeatureFlag();

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

            if (isProtonDocument(item.mimeType)) {
                void canUseDocs(item.rootShareId)
                    .then((canUse) => {
                        if (!canUse) {
                            return;
                        }

                        return openDocument({
                            linkId: item.linkId,
                            shareId: item.rootShareId,
                            openBehavior: 'tab',
                        });
                    })
                    .catch(sendErrorReport);
                return;
            }

            navigateToLink(item.rootShareId, item.linkId, item.isFile);
        },
        [navigateToLink, browserItems]
    );

    const handleItemRender = (item: SharedLinkItem) => {
        if (item.hasThumbnail && item.activeRevision && !item.cachedThumbnailUrl) {
            thumbnails.addToDownloadQueue(item.rootShareId, item.linkId, item.activeRevision.id);
        }
    };

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

    const Cells = viewportWidth['>=large'] ? largeScreenCells : smallScreenCells;
    const headerItems = viewportWidth['>=large'] ? headerItemsLargeScreen : headerItemsSmallScreen;

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
