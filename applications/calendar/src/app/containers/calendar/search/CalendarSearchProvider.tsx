import type { MutableRefObject, ReactNode } from 'react';
import { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import { useHistory } from 'react-router-dom';

import type { ESCalendarSearchParams, ESItem } from '@proton/encrypted-search/models';
import { useLoading } from '@proton/hooks';
import { VIEWS } from '@proton/shared/lib/calendar/constants';
import type { SimpleMap } from '@proton/shared/lib/interfaces';
import noop from '@proton/utils/noop';

import { extractSearchParameters, generatePathnameWithSearchParams } from '../../../helpers/encryptedSearch/esUtils';
import type { ESCalendarContent, ESCalendarMetadata } from '../../../interfaces/encryptedSearch';
import { useEncryptedSearchLibrary } from '../../EncryptedSearchLibraryProvider';
import { fromUrlParams } from '../getUrlHelper';
import type { VisualSearchItem } from './interface';

interface UseCalendarSearch {
    searchParams: ESCalendarSearchParams;
    items: ESItem<ESCalendarMetadata, ESCalendarContent>[];
    recurrenceIDsMap: SimpleMap<number[]>;
    search: (params: ESCalendarSearchParams) => void;
    triggerSearch: () => void;
    hasSearchedCounter: number;
    openedSearchItem: VisualSearchItem | undefined;
    setOpenedSearchItem: (item: VisualSearchItem | undefined) => void;
    /**
     * the state `isSearching` determines if the UI displays:
     * * a search bar (if true)
     * * a magnifier button (if false)
     */
    isSearching: boolean;
    setIsSearching: (isSearching: boolean) => void;
    lastNonSearchViewRef: MutableRefObject<VIEWS | undefined>;
    isEnabled?: boolean;
    isIndexing: boolean;
    isActive: boolean;
    disabled: boolean;
    loading: boolean;
    searchInput: string;
    setSearchInput: (search: string) => void;
}

const CalendarSearchContext = createContext<UseCalendarSearch>({
    searchParams: {},
    items: [],
    recurrenceIDsMap: {},
    search: noop,
    triggerSearch: noop,
    openedSearchItem: undefined,
    setOpenedSearchItem: noop,
    isSearching: false,
    setIsSearching: noop,
    lastNonSearchViewRef: { current: undefined },
    hasSearchedCounter: 0,
    isEnabled: undefined,
    isIndexing: false,
    isActive: false,
    disabled: true,
    loading: false,
    searchInput: '',
    setSearchInput: noop,
});
export const useCalendarSearch = () => useContext(CalendarSearchContext);

interface Props {
    children?: ReactNode;
}
const CalendarSearchProvider = ({ children }: Props) => {
    const history = useHistory();
    const { isLibraryInitialized, encryptedSearch, recurrenceIDsMap, esStatus } = useEncryptedSearchLibrary();

    const searchParams = extractSearchParameters(history.location);
    const keyword = searchParams?.keyword || '';

    const lastNonSearchViewRef = useRef<VIEWS>();
    const [hasSearchedCounter, setHasSearchedCounter] = useState(0);
    const [renderCounter, setRenderCounter] = useState(0);
    const isInitialSearching = fromUrlParams(history.location.pathname).view === VIEWS.SEARCH;
    const [isSearching, setIsSearching] = useState(isInitialSearching);
    const [loading, withLoading, setLoading] = useLoading(true);
    const [openedSearchItem, setOpenedSearchItem] = useState<VisualSearchItem>();
    const [searchInput, setSearchInput] = useState(keyword);

    const { dbExists, isEnablingEncryptedSearch, esEnabled, isRefreshing, isMetadataIndexingPaused } = esStatus;

    const isIndexing = isEnablingEncryptedSearch || isRefreshing || isMetadataIndexingPaused;
    const isActive = dbExists && !isIndexing;

    const triggerSearch = useCallback(() => {
        return setRenderCounter((c) => c + 1);
    }, []);

    const search = ({ keyword, begin, end }: ESCalendarSearchParams) => {
        history.push(
            generatePathnameWithSearchParams(history.location, {
                keyword,
                begin: begin ? begin.toString() : undefined,
                end: end ? end.toString() : undefined,
            })
        );
    };

    const [items, setItems] = useState<ESItem<ESCalendarMetadata, ESCalendarContent>[]>([]);

    useEffect(() => {
        if (!isLibraryInitialized) {
            return;
        }

        if (!keyword) {
            setLoading(false);
            return;
        }

        void withLoading(
            encryptedSearch((result) => {
                /**
                 * We have to copy to a new reference because ES library mutates the initial one, and it prevents a normal rerendering
                 */
                setItems([...result]);
            }).then(() => {
                setHasSearchedCounter((c) => c + 1);
            })
        );
        // eslint-disable-next-line react-hooks/exhaustive-deps -- autofix-eslint-A260C9
    }, [renderCounter, isLibraryInitialized, keyword]);

    const value = {
        searchParams,
        items,
        recurrenceIDsMap,
        search,
        triggerSearch,
        hasSearchedCounter,
        openedSearchItem,
        setOpenedSearchItem,
        isSearching,
        setIsSearching,
        lastNonSearchViewRef,
        isEnabled: isLibraryInitialized ? esEnabled : undefined,
        isIndexing,
        isActive,
        disabled: !isLibraryInitialized || !isActive,
        loading,
        searchInput,
        setSearchInput,
    };

    return <CalendarSearchContext.Provider value={value}>{children}</CalendarSearchContext.Provider>;
};

export default CalendarSearchProvider;
