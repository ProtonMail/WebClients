import { useEffect, useRef } from 'react';

import { c, msgid } from 'ttag';
import { useShallow } from 'zustand/react/shallow';

import { useActiveBreakpoint } from '@proton/components/index';

import { FileBrowserStateProvider } from '../../components/FileBrowser';
import ToolbarRow from '../../components/sections/ToolbarRow/ToolbarRow';
import { useContextMenuStore } from '../../modules/contextMenu';
import { useSelectionStore } from '../../modules/selection';
import { DriveExplorer } from '../../statelessComponents/DriveExplorer/DriveExplorer';
import type {
    DriveExplorerConditions,
    DriveExplorerEvents,
    DriveExplorerSelection,
    DriveExplorerSort,
} from '../../statelessComponents/DriveExplorer/types';
import { EnableSearchView } from './EnableSearchView';
import { NoSearchResultsView } from './NoSearchResultsView';
import { SearchContextMenu } from './SearchContextMenu';
import { getCellDefinitions, getGridDefinition } from './SearchDriveExplorerDefinitions';
import { SearchResultViewToolbar } from './Toolbar';
import { useSearchResultItems } from './hooks/useSearchResultItems';
import { useSearchViewNodesLoader } from './hooks/useSearchViewLoader';
import { useSearchViewModelAdapter } from './hooks/useSearchViewModelAdapter';
import { useSearchViewStore } from './store';
import { subscribeSearchStoreToEvents } from './subscribeSearchStoreToEvents';

const SearchResultTitle = ({ loading, resultCount }: { loading: boolean; resultCount: number }) => {
    return (
        <span className="text-strong pl-1">
            {loading
                ? c('Title').t`Searching…`
                : c('Title').ngettext(msgid`Found ${resultCount} result`, `Found ${resultCount} results`, resultCount)}
        </span>
    );
};

export const SearchView = () => {
    const {
        isSearchEnabled,
        isComputingSearchIndex,
        enableSearch,
        isSearching,
        resultUids,
        refresh: refreshSearchResults,
    } = useSearchViewModelAdapter();

    const contextMenuControls = useContextMenuStore();
    const contextMenuAnchorRef = useRef<HTMLDivElement>(null);

    const {
        sortedItemUids,
        loading,
        sortParams,
        handleOpenItem,
        handleSorting,
        handleRenderItem,
        layout,
        previewModal,
    } = useSearchResultItems();

    const { viewportWidth } = useActiveBreakpoint();

    const { loadNodes } = useSearchViewNodesLoader();

    // The store can go in a dirty state when one of the search results has changed
    // (renamed, moved, trashed, deleted, etc).
    const isStoreDirty = useSearchViewStore((state) => state.dirty);

    // Load nodes for current search query.
    useEffect(() => {
        const abortController = new AbortController();
        if (resultUids) {
            void loadNodes(resultUids, abortController.signal);
        }
        return () => {
            abortController.abort();
        };
    }, [loadNodes, resultUids]);

    useEffect(() => {
        // Store is dirty:
        //  -> it triggers a refresh of the search results
        //  -> new results trigger a new load
        //  -> loader sync the store and undirty it.
        if (isStoreDirty) {
            refreshSearchResults();
        }
    }, [isStoreDirty, refreshSearchResults]);

    useEffect(() => {
        // Make the search view react to Web Drive events.
        const unsubscribe = subscribeSearchStoreToEvents();
        return () => {
            unsubscribe();
        };
    }, []);

    const { selectedItemIds } = useSelectionStore(
        useShallow((state) => ({
            selectedItemIds: state.selectedItemIds,
        }))
    );

    // Initialize selection store.
    // TODO: Find a better, non-view/useEffect dependent place.
    useEffect(() => {
        useSelectionStore.getState().setAllItemIds(new Set(sortedItemUids));
    }, [sortedItemUids]);

    if (!isSearchEnabled) {
        return <EnableSearchView enableSearch={enableSearch} isComputingSearchIndex={isComputingSearchIndex} />;
    }

    if (!isSearching && resultUids.length === 0) {
        return <NoSearchResultsView />;
    }

    const selectionStore = useSelectionStore.getState();
    const selection: DriveExplorerSelection = {
        selectedItems: selectedItemIds,
        selectionMethods: {
            selectionState: selectionStore.getSelectionState(),
            selectItem: selectionStore.selectItem,
            toggleSelectItem: selectionStore.toggleSelectItem,
            toggleRange: selectionStore.toggleRange,
            toggleAllSelected: selectionStore.toggleAllSelected,
            clearSelections: selectionStore.clearSelections,
            isSelected: selectionStore.isSelected,
        },
    };

    const sort: DriveExplorerSort = {
        sortBy: sortParams.sortField,
        sortDirection: sortParams.sortOrder,
        onSort: handleSorting,
    };

    const cells = getCellDefinitions({ viewportWidth });
    const grid = getGridDefinition();

    const events: DriveExplorerEvents = {
        onItemDoubleClick: (uid) => {
            void handleOpenItem(uid);
        },
        onItemRender: (uid) => {
            handleRenderItem({ id: uid });
        },
        onItemClick: () => {
            if (contextMenuControls.isOpen) {
                contextMenuControls.close();
            }
        },
        onItemContextMenu: (uid, event) => {
            contextMenuControls.handleContextMenu(event);
        },
    };

    const conditions: DriveExplorerConditions = {
        isDraggable: () => {
            // TODO: Add DnD
            return false;
        },
        isDoubleClickable: () => {
            return true;
        },
    };

    const isDriveExplorerLoading = isSearching || loading;

    return (
        <FileBrowserStateProvider itemIds={sortedItemUids}>
            <ToolbarRow
                titleArea={<SearchResultTitle loading={isDriveExplorerLoading} resultCount={sortedItemUids.length} />}
                toolbar={<SearchResultViewToolbar uids={[...selectedItemIds]} />}
            />
            <div className="flex flex-1">
                <SearchContextMenu
                    anchorRef={contextMenuAnchorRef}
                    close={contextMenuControls.close}
                    isOpen={contextMenuControls.isOpen}
                    open={contextMenuControls.open}
                    position={contextMenuControls.position}
                />
                <DriveExplorer
                    itemIds={sortedItemUids}
                    loading={isDriveExplorerLoading}
                    sort={sort}
                    layout={layout}
                    cells={cells}
                    grid={grid}
                    selection={selection}
                    caption={c('Title').t`Search results`}
                    events={events}
                    conditions={conditions}
                    contextMenuControls={{
                        isOpen: contextMenuControls.isOpen,
                        showContextMenu: contextMenuControls.handleContextMenu,
                        close: contextMenuControls.close,
                    }}
                />
                {previewModal}
            </div>
        </FileBrowserStateProvider>
    );
};
