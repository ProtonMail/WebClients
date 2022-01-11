import { useState, createContext, useEffect, useContext, useRef, useCallback } from 'react';
import * as React from 'react';

import { FileBrowserItem } from '@proton/shared/lib/interfaces/drive/fileBrowser';

import useSelection from '../../../hooks/util/useSelection';
import { useSearchResultsStorage } from '../../search/SearchResultsStorage';
import { useSearchIndexingContext } from '../../search/indexing/SearchIndexingProvider';

interface TrashContentProviderState {
    contents: FileBrowserItem[];
    loadNextPage: () => void;
    fileBrowserControls: Omit<ReturnType<typeof useSelection>, 'selectedItems'> & {
        selectedItems: FileBrowserItem[];
    };
    loading: boolean;
    initialized: boolean;
    complete?: boolean;
}

const SearchContentContext = createContext<TrashContentProviderState | null>(null);

export const SearchContentProvider = ({ children, shareId }: { children: React.ReactNode; shareId: string }) => {
    const esResultStorage = useSearchResultsStorage();
    const es = useSearchIndexingContext();

    const [isInitialized, setInitialized] = useState(false);
    const isInited = useRef(false);

    const abortSignal = useRef<AbortSignal>();
    // TODO: change when meta fetching added
    const complete = true;
    const sortedList = esResultStorage.getResults();

    const selectionControls = useSelection(
        sortedList.map((data) => ({
            id: data.LinkID,
            disabled: false,
            data,
        }))
    );
    const fileBrowserControls = {
        ...selectionControls,
        selectedItems: selectionControls.selectedItems.map(({ data }) => data),
    };

    const loadNextPage = useCallback(async () => {
        // TODO: here goes meta fetching
    }, [shareId]);

    useEffect(() => {
        const abortController = new AbortController();
        abortSignal.current = abortController.signal;
        fileBrowserControls.clearSelections();

        if (!isInitialized) {
            loadNextPage()
                .then(() => {
                    setInitialized(true);
                })
                .catch(console.error);
        }

        return () => {
            esResultStorage.clearResults();
            abortController.abort();
        };
    }, [loadNextPage]);

    useEffect(() => {
        if (!isInited.current && es.getESDBStatus().dbExists) {
            esResultStorage.runSearch().catch((e) => {
                // XXX: notification?
                console.warn(e);
            });
            isInited.current = true;
        }
    }, [esResultStorage.runSearch, es.getESDBStatus().dbExists, location]);

    return (
        <SearchContentContext.Provider
            value={{
                loading: esResultStorage.isLoading,
                initialized: isInitialized,
                fileBrowserControls,
                loadNextPage,
                contents: sortedList,
                complete,
            }}
        >
            {children}
        </SearchContentContext.Provider>
    );
};

export const useSearchContent = () => {
    const state = useContext(SearchContentContext);
    if (!state) {
        throw new Error('Trying to use uninitialized TrashContentProvider');
    }
    return state;
};
