import { useCallback, useEffect, useMemo, useRef } from 'react';

import { c } from 'ttag';
import { useShallow } from 'zustand/react/shallow';

import { ContactEmailsProvider, useActiveBreakpoint } from '@proton/components';
import { NodeType } from '@proton/drive/index';
import { SORT_DIRECTION } from '@proton/shared/lib/constants';
import { isProtonDocsDocument, isProtonDocsSpreadsheet } from '@proton/shared/lib/helpers/mimetype';
import isTruthy from '@proton/utils/isTruthy';

import FileBrowser, {
    GridHeader,
    type ListViewHeaderItem,
    useItemContextMenu,
    useSelection,
} from '../../components/FileBrowser';
import { GridViewItem } from '../../components/sections/FileBrowser/GridViewItemLink';
import headerItems from '../../components/sections/FileBrowser/headerCells';
import { translateSortField } from '../../components/sections/SortDropdown';
import { useBatchThumbnailLoader } from '../../hooks/drive/useBatchThumbnailLoader';
import { useBookmarksActions } from '../../hooks/drive/useBookmarksActions';
import useDriveNavigation from '../../hooks/drive/useNavigate';
import { useOnItemRenderedMetrics } from '../../hooks/drive/useOnItemRenderedMetrics';
import { SortField, type SortParams, useSortingWithDefault } from '../../hooks/util/useSorting';
import { useDocumentActions, useUserSettings } from '../../store';
import { useDriveDocsFeatureFlag } from '../../store/_documents';
import { dateToLegacyTimestamp } from '../../utils/sdk/legacyTime';
import { ItemType, getKeyUid, useSharedWithMeListingStore } from '../../zustand/sections/sharedWithMeListing.store';
import EmptySharedWithMe from './EmptySharedWithMe';
import { largeScreenCells, smallScreenCells } from './SharedWithMeCells';
import { SharedWithMeContextMenu } from './SharedWithMeItemContextMenu';

const DEFAULT_SORT = {
    sortField: 'sharedOn' as SortField,
    sortOrder: SORT_DIRECTION.DESC,
};

const headerItemsLargeScreen: ListViewHeaderItem[] = [
    headerItems.checkbox,
    headerItems.name,
    headerItems.sharedBy,
    headerItems.sharedOnDate,
    headerItems.placeholder,
];

const headerItemsSmallScreen: ListViewHeaderItem[] = [headerItems.checkbox, headerItems.name, headerItems.placeholder];

type SharedWithMeSortFields = Extract<SortField, SortField.name | SortField.sharedBy | SortField.sharedOn>;
const SORT_FIELDS: SharedWithMeSortFields[] = [SortField.name, SortField.sharedBy, SortField.sharedOn];

const getSelectedItemsId = (items: { id: string }[], selectedItemIds: string[]) =>
    selectedItemIds.map((selectedItemId) => items.find((item) => selectedItemId === item.id)).filter(isTruthy);

// TODO: Separate in two components and make the state hook that can be also unit tested.
const SharedWithMe = () => {
    const contextMenuAnchorRef = useRef<HTMLDivElement>(null);

    const { navigateToLink, navigateToAlbum } = useDriveNavigation();

    const browserItemContextMenu = useItemContextMenu();
    const selectionControls = useSelection();
    const { viewportWidth } = useActiveBreakpoint();
    const { openDocument } = useDocumentActions();
    const { isDocsEnabled } = useDriveDocsFeatureFlag();
    const { openBookmark } = useBookmarksActions();
    const { layout } = useUserSettings();
    const { loadThumbnail } = useBatchThumbnailLoader();

    const {
        getSharedWithMeStoreItem,
        getInvitationPositionedItems,
        getRegularItems,
        clearItemsWithInvitationPosition,
        isLoading,
    } = useSharedWithMeListingStore(
        useShallow((state) => ({
            getSharedWithMeStoreItem: state.getSharedWithMeItem,
            getInvitationPositionedItems: state.getInvitationPositionedItems,
            getRegularItems: state.getRegularItems,
            clearItemsWithInvitationPosition: state.clearItemsWithInvitationPosition,
            isLoading: state.isLoading(),
        }))
    );

    // Clear on components mount, first listing of items
    useEffect(() => {
        clearItemsWithInvitationPosition();
    }, [clearItemsWithInvitationPosition]);

    const { incrementItemRenderedCounter } = useOnItemRenderedMetrics(layout, isLoading);

    const handleRenderItem = useCallback(
        (uid: string) => {
            incrementItemRenderedCounter();
            const renderedItem = getSharedWithMeStoreItem(uid);
            if (renderedItem?.thumbnailId && renderedItem.itemType !== ItemType.BOOKMARK) {
                loadThumbnail({
                    uid: renderedItem.nodeUid,
                    thumbnailId: renderedItem.thumbnailId,
                    hasThumbnail: true,
                    cachedThumbnailUrl: '',
                });
            }
        },
        [getSharedWithMeStoreItem, incrementItemRenderedCounter, loadThumbnail]
    );

    const invitationPositionedItems = getInvitationPositionedItems();
    const regularItems = getRegularItems();

    // Map regular items for sorting
    const regularItemsToSort = regularItems.map((item) => ({
        uid: getKeyUid(item),
        isFile: item.type === NodeType.File,
        name: item.name,
        mimeType: item.mediaType || '',
        size: 0,
        metaDataModifyTime: 0,
        fileModifyTime: 0,
        trashed: null,
        sharedOn:
            (item.itemType === ItemType.BOOKMARK && dateToLegacyTimestamp(item.bookmark.creationTime)) ||
            (item.itemType === ItemType.DIRECT_SHARE && dateToLegacyTimestamp(item.directShare.sharedOn)) ||
            undefined,
        sharedBy: (item.itemType === ItemType.DIRECT_SHARE && item.directShare.sharedBy) || '',
    }));

    const { sortedList, sortParams, setSorting } = useSortingWithDefault(regularItemsToSort, DEFAULT_SORT);

    const items = [...invitationPositionedItems, ...sortedList];

    const handleSorting = useCallback(
        (sortParamsInput: SortParams<SortField>) => {
            void setSorting(sortParamsInput);
            clearItemsWithInvitationPosition();
        },
        [clearItemsWithInvitationPosition, setSorting]
    );

    const getMapLegacyItems = () => {
        const mappedItems = [];
        for (const item of items) {
            const keyUid = 'uid' in item ? item.uid : getKeyUid(item);
            const storeItem = getSharedWithMeStoreItem(keyUid);
            if (storeItem) {
                mappedItems.push({
                    id: keyUid,
                    trashed: null,
                    volumeId: storeItem.legacy.volumeId,
                    parentLinkId: '',
                    rootShareId: storeItem.legacy.shareId,
                    mimeType: storeItem.mediaType || '',
                    linkId: storeItem.legacy.linkId,
                    isFile: storeItem.type === NodeType.File,
                    name: storeItem.name,
                    size: storeItem.size || 0,
                });
            }
        }
        return mappedItems;
    };

    const mapLegacyItems = getMapLegacyItems();

    const selectedItemIds = selectionControls!.selectedItemIds;
    const selectedBrowserItemsIds = getSelectedItemsId(mapLegacyItems, selectedItemIds);
    const selectedBrowserItems = useMemo(
        () => selectedBrowserItemsIds.map(({ id }) => getSharedWithMeStoreItem(id)).filter(isTruthy),
        [selectedBrowserItemsIds, getSharedWithMeStoreItem]
    );

    const handleClick = useCallback(
        (uid: string) => {
            const item = getSharedWithMeStoreItem(uid);
            if (!item) {
                return;
            }
            if (item.itemType === ItemType.BOOKMARK) {
                void openBookmark(item.bookmark.url);
                return;
            }
            document.getSelection()?.removeAllRanges();

            if (item.mediaType && isProtonDocsDocument(item.mediaType)) {
                if (isDocsEnabled) {
                    return openDocument({
                        type: 'doc',
                        linkId: item.legacy.linkId,
                        shareId: item.legacy.shareId,
                        openBehavior: 'tab',
                    });
                }
                return;
            } else if (item.mediaType && isProtonDocsSpreadsheet(item.mediaType)) {
                if (isDocsEnabled) {
                    return openDocument({
                        type: 'sheet',
                        linkId: item.legacy.linkId,
                        shareId: item.legacy.shareId,
                        openBehavior: 'tab',
                    });
                }
                return;
            }

            if (item.type === NodeType.Album) {
                navigateToAlbum(item.legacy.shareId, item.legacy.linkId);
                return;
            }
            navigateToLink(item.legacy.shareId, item.legacy.linkId, item.type === NodeType.File);
        },
        [navigateToLink, openBookmark, isDocsEnabled, openDocument, navigateToAlbum, getSharedWithMeStoreItem]
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
                        onSort={handleSorting}
                        sortField={sortParams.sortField}
                        sortOrder={sortParams.sortOrder}
                        itemCount={items.length}
                        scrollAreaRef={scrollAreaRef}
                        activeSortingText={activeSortingText}
                    />
                );
            },
        [sortParams.sortField, sortParams.sortOrder, isLoading, handleSorting, items.length]
    );

    if (!mapLegacyItems.length && !isLoading) {
        return <EmptySharedWithMe />;
    }

    const Cells = viewportWidth['>=large'] ? largeScreenCells : smallScreenCells;
    const headerItems = viewportWidth['>=large'] ? headerItemsLargeScreen : headerItemsSmallScreen;

    return (
        <ContactEmailsProvider>
            <SharedWithMeContextMenu
                selectedBrowserItems={selectedBrowserItems}
                anchorRef={contextMenuAnchorRef}
                close={browserItemContextMenu.close}
                isOpen={browserItemContextMenu.isOpen}
                open={browserItemContextMenu.open}
                position={browserItemContextMenu.position}
            />
            <FileBrowser
                caption={c('Title').t`Shared`}
                items={mapLegacyItems}
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
                onItemRender={(item) => handleRenderItem(item.id)}
                onSort={handleSorting}
                onScroll={browserItemContextMenu.close}
            />
        </ContactEmailsProvider>
    );
};

export default SharedWithMe;
