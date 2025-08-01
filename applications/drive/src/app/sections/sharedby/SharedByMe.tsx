import { memo, useMemo, useRef } from 'react';

import { c } from 'ttag';

import { useActiveBreakpoint } from '@proton/components';
import { isProtonDocsDocument, isProtonDocsSpreadsheet } from '@proton/shared/lib/helpers/mimetype';
import isTruthy from '@proton/utils/isTruthy';

import type { BrowserItemId, ListViewHeaderItem } from '../../components/FileBrowser';
import FileBrowser, { Cells, GridHeader, useItemContextMenu, useSelection } from '../../components/FileBrowser';
import { GridViewItem } from '../../components/sections/FileBrowser/GridViewItemLink';
import {
    AccessCountCell,
    CreatedCell,
    ExpirationCell,
    LocationCell,
    NameCell,
} from '../../components/sections/FileBrowser/contentCells';
import headerItems from '../../components/sections/FileBrowser/headerCells';
import { translateSortField } from '../../components/sections/SortDropdown';
import { useFlagsDriveDocs } from '../../flags/useFlagsDriveDocs';
import { useDocumentActions } from '../../hooks/docs/useDocumentActions';
import useDriveNavigation from '../../hooks/drive/useNavigate';
import { useOnItemRenderedMetrics } from '../../hooks/drive/useOnItemRenderedMetrics';
import { SortField, type SortParams } from '../../hooks/util/useSorting';
import { useUserSettings } from '../../store';
import type { LegacyItem } from '../../utils/sdk/mapNodeToLegacyItem';
import { useSharingInfoStore } from '../../zustand/share/sharingInfo.store';
import { useThumbnailStore } from '../../zustand/thumbnail/thumbnail.store';
import { EmptySharedByMe } from './EmptySharedByMe';
import { SharedByMeItemContextMenu } from './SharedByMeItemContextMenu';

type Props = {
    sharedByMeNodes: LegacyItem[];
    isLoading: boolean;
    setSorting: (sortParams: SortParams<SortField>) => Promise<void>;
    sortParams: SortParams<SortField>;
    shareId: string;
    onRenderItem: (uid: string) => void;
};

const { CheckboxCell, ContextMenuCell } = Cells;

export const getSelectedItems = (items: LegacyItem[], selectedItemIds: string[]): LegacyItem[] => {
    if (items) {
        return selectedItemIds
            .map((selectedItemId) => items.find(({ isLocked, ...item }) => !isLocked && selectedItemId === item.id))
            .filter(isTruthy);
    }

    return [];
};

const useMappedShareUrl = (uid: string) => {
    const sharingInfo = useSharingInfoStore((state) => state.getSharingInfo(uid));
    return sharingInfo
        ? {
              id: sharingInfo.shareId,
              token: sharingInfo.publicLinkId,
              isExpired: sharingInfo.isExpired,
              createTime: sharingInfo.creationTime,
              expireTime: sharingInfo.expirationTime,
              numAccesses: sharingInfo.numberOfInitializedDownloads,
          }
        : undefined;
};

const NameCellWithThumbnail = ({ item }: { item: LegacyItem }) => {
    const thumbnail = useThumbnailStore((state) => state.thumbnails[item.thumbnailId]);
    return <NameCell item={{ ...item, cachedThumbnailUrl: item.cachedThumbnailUrl || thumbnail?.sdUrl }} />;
};

const AccessCountCellWithSharingInfo = ({ item }: { item: LegacyItem }) => {
    const shareUrl = useMappedShareUrl(item.uid);
    return <AccessCountCell item={{ ...item, shareUrl: item.shareUrl || shareUrl }} />;
};

const ExpirationCellWithSharingInfo = ({ item }: { item: LegacyItem }) => {
    const shareUrl = useMappedShareUrl(item.uid);
    return <ExpirationCell item={{ ...item, shareUrl: item.shareUrl || shareUrl }} />;
};

const CreatedCellWithSharingInfo = ({ item }: { item: LegacyItem }) => {
    const shareUrl = useMappedShareUrl(item.uid);
    return <CreatedCell item={{ ...item, shareUrl: item.shareUrl || shareUrl }} />;
};

const GridViewItemWithStores = memo(({ item }: { item: LegacyItem }) => {
    const thumbnail = useThumbnailStore((state) => state.thumbnails[item.thumbnailId]);
    const shareUrl = useMappedShareUrl(item.uid);
    return (
        <GridViewItem
            item={{
                ...item,
                cachedThumbnailUrl: item.cachedThumbnailUrl || thumbnail?.sdUrl,
                shareUrl: item.shareUrl || shareUrl,
            }}
        />
    );
});
GridViewItemWithStores.displayName = 'GridViewItemWithStores';

const largeScreenCells: React.FC<{ item: LegacyItem }>[] = [
    CheckboxCell,
    NameCellWithThumbnail,
    LocationCell,
    CreatedCellWithSharingInfo,
    AccessCountCellWithSharingInfo,
    ExpirationCellWithSharingInfo,
    ContextMenuCell,
];

const smallScreenCells = [
    CheckboxCell,
    NameCellWithThumbnail,
    LocationCell,
    ExpirationCellWithSharingInfo,
    ContextMenuCell,
];

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
type SharedByMeSortFields = Extract<
    SortField,
    SortField.name | SortField.linkCreateTime | SortField.linkExpireTime | SortField.numAccesses
>;
const SORT_FIELDS: SharedByMeSortFields[] = [
    SortField.name,
    SortField.linkCreateTime,
    SortField.linkExpireTime,
    SortField.numAccesses,
];

export const SharedByMe = ({ sharedByMeNodes, isLoading, setSorting, sortParams, shareId, onRenderItem }: Props) => {
    const contextMenuAnchorRef = useRef<HTMLDivElement>(null);
    const browserItemContextMenu = useItemContextMenu();
    const { layout } = useUserSettings();
    const { incrementItemRenderedCounter } = useOnItemRenderedMetrics(layout, isLoading);
    const selectionControls = useSelection();
    const { viewportWidth } = useActiveBreakpoint();
    const { openDocument } = useDocumentActions();
    const { isDocsEnabled } = useFlagsDriveDocs();
    const { navigateToAlbum, navigateToLink } = useDriveNavigation();

    const selectedItems = selectionControls ? getSelectedItems(sharedByMeNodes, selectionControls.selectedItemIds) : [];

    const handleClick = (uid: BrowserItemId) => {
        const item = sharedByMeNodes.find((item) => item.id === uid);

        if (!item) {
            return;
        }
        document.getSelection()?.removeAllRanges();

        if (item.mimeType && isProtonDocsDocument(item.mimeType)) {
            if (isDocsEnabled) {
                return openDocument({
                    type: 'doc',
                    uid: item.linkId,
                    openBehavior: 'tab',
                });
            }
            return;
        } else if (item.mimeType && isProtonDocsSpreadsheet(item.mimeType)) {
            if (isDocsEnabled) {
                return openDocument({
                    type: 'sheet',
                    uid: item.linkId,
                    openBehavior: 'tab',
                });
            }
            return;
        } else if (item.mimeType === 'Album') {
            navigateToAlbum(item.rootShareId, item.linkId);
            return;
        }

        navigateToLink(item.rootShareId, item.linkId, item.isFile);
    };

    const handleItemRender = (item: LegacyItem) => {
        incrementItemRenderedCounter();
        onRenderItem(item.uid);
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
                        itemCount={sharedByMeNodes.length}
                        scrollAreaRef={scrollAreaRef}
                        activeSortingText={activeSortingText}
                    />
                );
            },
        [sortParams.sortField, sortParams.sortOrder, isLoading, setSorting, sharedByMeNodes.length]
    );

    if (!sharedByMeNodes.length && !isLoading) {
        return <EmptySharedByMe shareId={shareId} />;
    }

    const Cells = viewportWidth['>=large'] ? largeScreenCells : smallScreenCells;
    const headerItems = viewportWidth['>=large'] ? headerItemsLargeScreen : headerItemsSmallScreen;
    return (
        <>
            <SharedByMeItemContextMenu
                selectedLinks={selectedItems}
                anchorRef={contextMenuAnchorRef}
                close={browserItemContextMenu.close}
                isOpen={browserItemContextMenu.isOpen}
                open={browserItemContextMenu.open}
                position={browserItemContextMenu.position}
            />
            <FileBrowser
                caption={c('Title').t`Shared`}
                items={sharedByMeNodes}
                headerItems={headerItems}
                layout={layout}
                loading={isLoading}
                sortParams={sortParams}
                Cells={Cells}
                GridHeaderComponent={GridHeaderComponent}
                GridViewItem={GridViewItemWithStores}
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
