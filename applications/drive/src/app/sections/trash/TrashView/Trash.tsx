import { useMemo, useRef } from 'react';

import { c } from 'ttag';
import { useShallow } from 'zustand/react/shallow';

import { useActiveBreakpoint } from '@proton/components';
import { isProtonDocsDocument, isProtonDocsSpreadsheet } from '@proton/shared/lib/helpers/mimetype';
import isTruthy from '@proton/utils/isTruthy';

import FileBrowser, { Cells, GridHeader, useItemContextMenu, useSelection } from '../../../components/FileBrowser';
import type { BrowserItemId, ListViewHeaderItem } from '../../../components/FileBrowser/interface';
import { GridViewItem } from '../../../components/sections/FileBrowser/GridViewItemLink';
import { DeletedCell, LocationCell, NameCell, SizeCell } from '../../../components/sections/FileBrowser/contentCells';
import headerItems from '../../../components/sections/FileBrowser/headerCells';
import { translateSortField } from '../../../components/sections/SortDropdown';
import { useBatchThumbnailLoader } from '../../../hooks/drive/useBatchThumbnailLoader';
import useDriveNavigation from '../../../hooks/drive/useNavigate';
import { useOnItemRenderedMetrics } from '../../../hooks/drive/useOnItemRenderedMetrics';
import { useUserSettings } from '../../../store';
import { useDocumentActions, useDriveDocsFeatureFlag } from '../../../store/_documents';
import { SortField } from '../../../store/_views/utils/useSorting';
import type { LegacyItem } from '../../../utils/sdk/mapNodeToLegacyItem';
import { useThumbnailStore } from '../../../zustand/thumbnails/thumbnails.store';
import { TrashItemContextMenu } from '../menus/TrashItemContextMenu';
import type { useTrashNodes } from '../useTrashNodes';
import { EmptyTrash } from './EmptyTrash';

interface Props {
    shareId: string;
    trashView: ReturnType<typeof useTrashNodes>;
}

const { CheckboxCell, ContextMenuCell } = Cells;

const largeScreenCells: React.FC<{ item: LegacyItem }>[] = [
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

const getSelectedItemsId = (items: LegacyItem[], selectedItemIds: string[]): LegacyItem[] => {
    if (items) {
        return selectedItemIds
            .map((selectedItemId) => items.find(({ isLocked, ...item }) => !isLocked && selectedItemId === item.id))
            .filter(isTruthy);
    }

    return [];
};

export function Trash({ shareId, trashView }: Props) {
    const contextMenuAnchorRef = useRef<HTMLDivElement>(null);
    const browserItemContextMenu = useItemContextMenu();
    const { viewportWidth } = useActiveBreakpoint();
    const { isDocsEnabled } = useDriveDocsFeatureFlag();
    const { openDocument } = useDocumentActions();
    const { navigateToLink } = useDriveNavigation();
    const selectionControls = useSelection();
    const { trashNodes, isLoading, sortParams, setSorting } = trashView;
    const { getThumbnail } = useThumbnailStore(
        useShallow((state) => ({
            getThumbnail: state.getThumbnail,
        }))
    );
    const { loadThumbnail } = useBatchThumbnailLoader();
    const { layout } = useUserSettings();
    const selectedItems = getSelectedItemsId(trashNodes, selectionControls!.selectedItemIds);
    const { incrementItemRenderedCounter } = useOnItemRenderedMetrics(layout, isLoading);

    const handleItemRender = async (item: LegacyItem) => {
        incrementItemRenderedCounter();

        loadThumbnail({
            uid: item.uid,
            thumbnailId: item.thumbnailId || item.uid,
            hasThumbnail: !!item.thumbnailId,
            cachedThumbnailUrl: undefined,
        });
    };

    const nodesWithThumbnail = trashNodes.map((node) => ({
        ...node,
        cachedThumbnailUrl: getThumbnail(node.thumbnailId)?.sdUrl,
    }));

    const handleClick = (id: BrowserItemId) => {
        const item = trashNodes.find((item) => item.id === id);

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
        /**
                Opening a file preview opens the file in the context of folder.
                For photos in the photo stream, it is fine as it is regular folder.
                But photos in albums only (uploaded by other users) are not in the
                context of folder and it requires dedicated album endpoints to load
                "folder". We do not support this in regular preview, so the easiest
                is to disable opening preview for such a link.
                In the future, ideally we want trash of photos to separate to own
                screen or app, then it will not be a problem. In mid-term, we want
                to open preview without folder context - that is to not redirect to
                FolderContainer, but open preview on the same page. That will also
                fix the problem with returning back to trash and stay on the same
                place in the view.
             **/

        if (item.photoProperties?.albums.some((album) => album.albumLinkId === item.parentLinkId)) {
            return;
        }

        navigateToLink(item.rootShareId, id, item.isFile);
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
                        itemCount={trashNodes.length}
                        scrollAreaRef={scrollAreaRef}
                        activeSortingText={activeSortingText}
                    />
                );
            },
        [sortParams.sortField, sortParams.sortOrder, isLoading]
    );

    if (!trashNodes.length && !isLoading) {
        return <EmptyTrash />;
    }

    const Cells = viewportWidth['>=large'] ? largeScreenCells : smallScreenCells;
    const headerItems = viewportWidth['>=large'] ? headerItemsLargeScreen : headerItemsSmallScreen;

    return (
        <>
            <TrashItemContextMenu
                trashView={trashView}
                selectedItems={selectedItems}
                anchorRef={contextMenuAnchorRef}
                close={browserItemContextMenu.close}
                isOpen={browserItemContextMenu.isOpen}
                open={browserItemContextMenu.open}
                position={browserItemContextMenu.position}
            />
            <FileBrowser
                caption={c('Title').t`Trash`}
                items={nodesWithThumbnail}
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
