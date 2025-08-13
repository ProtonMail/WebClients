import { useMemo, useRef } from 'react';

import { c } from 'ttag';

import { ContactEmailsProvider, useActiveBreakpoint } from '@proton/components';

import FileBrowser, { GridHeader, useItemContextMenu } from '../../components/FileBrowser';
import { GridViewItem } from '../../components/sections/FileBrowser/GridViewItemLink';
import headerItems from '../../components/sections/FileBrowser/headerCells';
import { translateSortField } from '../../components/sections/SortDropdown';
import { SortField } from '../../hooks/util/useSorting';
import EmptySharedWithMe from './EmptySharedWithMe';
import { largeScreenCells, smallScreenCells } from './SharedWithMeCells';
import { SharedWithMeContextMenu } from './SharedWithMeItemContextMenu';
import { useSharedWithMeItemsWithSelection } from './hooks/useSharedWithMeItemsWithSelection';

const headerItemsLargeScreen = [
    headerItems.checkbox,
    headerItems.name,
    headerItems.sharedBy,
    headerItems.sharedOnDate,
    headerItems.placeholder,
];

const headerItemsSmallScreen = [headerItems.checkbox, headerItems.name, headerItems.placeholder];

type SharedWithMeSortFields = Extract<SortField, SortField.name | SortField.sharedBy | SortField.sharedOn>;
const SORT_FIELDS: SharedWithMeSortFields[] = [SortField.name, SortField.sharedBy, SortField.sharedOn];

const SharedWithMe = () => {
    const { viewportWidth } = useActiveBreakpoint();
    const contextMenuAnchorRef = useRef<HTMLDivElement>(null);
    const browserItemContextMenu = useItemContextMenu();

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
    } = useSharedWithMeItemsWithSelection();

    const headerItems = viewportWidth['>=large'] ? headerItemsLargeScreen : headerItemsSmallScreen;
    const Cells = viewportWidth['>=large'] ? largeScreenCells : smallScreenCells;

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
        return <EmptySharedWithMe />;
    }

    return (
        <ContactEmailsProvider>
            <SharedWithMeContextMenu
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
                GridViewItem={GridViewItem}
                contextMenuAnchorRef={contextMenuAnchorRef}
                onItemContextMenu={browserItemContextMenu.handleContextMenu}
                onItemOpen={handleOpenItem}
                onItemRender={(item) => handleRenderItem(item.id)}
                onSort={handleSorting}
                onScroll={browserItemContextMenu.close}
            />
        </ContactEmailsProvider>
    );
};

export default SharedWithMe;
