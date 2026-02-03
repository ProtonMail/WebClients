import { useEffect } from 'react';

import { c, msgid } from 'ttag';

import { useActiveBreakpoint } from '@proton/components/index';

import { FileBrowserStateProvider } from '../../components/FileBrowser';
import ToolbarRow from '../../components/sections/ToolbarRow/ToolbarRow';
import { DriveExplorer } from '../../statelessComponents/DriveExplorer/DriveExplorer';
import type {
    DriveExplorerConditions,
    DriveExplorerEvents,
    DriveExplorerSelection,
    DriveExplorerSort,
} from '../../statelessComponents/DriveExplorer/types';
import { EnableSearchView } from './EnableSearchView';
import { NoSearchResultsView } from './NoSearchResultsView';
import { getCellDefinitions, getGridDefinition } from './SearchDriveExplorerDefinitions';
import { SearchResultViewToolbar } from './Toolbar';
import { useSearchResultItems } from './hooks/useSearchResultItems';
import { useSearchViewNodesLoader } from './hooks/useSearchViewLoader';
import { useSearchViewModelAdapter } from './hooks/useSearchViewModelAdapter';

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
    const { isSearchEnabled, isComputingSearchIndex, enableSearch, isSearching, resultUids } =
        useSearchViewModelAdapter();

    const {
        sortedItemUids,
        loading,
        sortParams,
        handleOpenItem,
        handleSorting,
        handleRenderItem,
        layout,
        previewModal,
        selectionControls,
    } = useSearchResultItems();

    const { viewportWidth } = useActiveBreakpoint();

    const { loadNodes } = useSearchViewNodesLoader();

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

    if (!isSearchEnabled) {
        return <EnableSearchView enableSearch={enableSearch} isComputingSearchIndex={isComputingSearchIndex} />;
    }

    if (!isSearching && resultUids.length === 0) {
        return <NoSearchResultsView />;
    }

    const selection: DriveExplorerSelection = {
        selectedItems: new Set(selectionControls.selectedItemIds),
        selectionMethods: selectionControls,
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
        // TODO: Close context menu on item click
        // TODO: Handle context menu event
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
                // TODO: Pass selected ids to toolbar and implement
                toolbar={<SearchResultViewToolbar uids={[]} />}
            />
            <div className="flex flex-1">
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
                />
                {previewModal}
            </div>
        </FileBrowserStateProvider>
    );
};
