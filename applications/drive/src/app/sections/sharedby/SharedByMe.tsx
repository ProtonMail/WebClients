import { useMemo, useRef } from 'react';

import { c } from 'ttag';

import { useActiveBreakpoint } from '@proton/components';
import isTruthy from '@proton/utils/isTruthy';

import type { ListViewHeaderItem } from '../../components/FileBrowser';
import FileBrowser, { GridHeader, useItemContextMenu } from '../../components/FileBrowser';
import { GridViewItemWithThumbnail } from '../../components/GridViewItemWithThumbnail';
import headerItems from '../../components/sections/FileBrowser/headerCells';
import { translateSortField } from '../../components/sections/SortDropdown';
import { SortField } from '../../hooks/util/useSorting';
import type { LegacyItem } from '../../utils/sdk/mapNodeToLegacyItem';
import { EmptySharedByMe } from './EmptySharedByMe';
import { largeScreenCells, smallScreenCells } from './SharedByMeCells';
import { SharedByMeItemContextMenu } from './SharedByMeItemContextMenu';
import { useSharedByMeItemsWithSelection } from './hooks/useSharedByMeItemsWithSelection';

export const getSelectedItems = (items: LegacyItem[], selectedItemIds: string[]): LegacyItem[] => {
    if (items) {
        return selectedItemIds
            .map((selectedItemId) => items.find(({ isLocked, ...item }) => !isLocked && selectedItemId === item.id))
            .filter(isTruthy);
    }

    return [];
};

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

interface SharedByMeProps {
    shareId: string;
}

export const SharedByMe = ({ shareId }: SharedByMeProps) => {
    const contextMenuAnchorRef = useRef<HTMLDivElement>(null);
    const browserItemContextMenu = useItemContextMenu();
    const { viewportWidth } = useActiveBreakpoint();

    const {
        items,
        selectedItems,
        isLoading,
        layout,
        sortParams,
        handleOpenItem,
        handleRenderItem,
        handleSorting,
        isEmpty,
    } = useSharedByMeItemsWithSelection();

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

    if (isEmpty) {
        return <EmptySharedByMe shareId={shareId} />;
    }

    const Cells = viewportWidth['>=large'] ? largeScreenCells : smallScreenCells;
    const headerItems = viewportWidth['>=large'] ? headerItemsLargeScreen : headerItemsSmallScreen;
    return (
        <>
            <SharedByMeItemContextMenu
                selectedBrowserItems={selectedItems}
                anchorRef={contextMenuAnchorRef}
                close={browserItemContextMenu.close}
                isOpen={browserItemContextMenu.isOpen}
                open={browserItemContextMenu.open}
                position={browserItemContextMenu.position}
            />
            <FileBrowser
                caption={c('Title').t`Shared`}
                items={items}
                headerItems={headerItems}
                layout={layout}
                loading={isLoading}
                sortParams={sortParams}
                Cells={Cells}
                GridHeaderComponent={GridHeaderComponent}
                GridViewItem={GridViewItemWithThumbnail}
                contextMenuAnchorRef={contextMenuAnchorRef}
                onItemContextMenu={browserItemContextMenu.handleContextMenu}
                onItemOpen={handleOpenItem}
                onItemRender={handleRenderItem}
                onSort={handleSorting}
                onScroll={browserItemContextMenu.close}
            />
        </>
    );
};
