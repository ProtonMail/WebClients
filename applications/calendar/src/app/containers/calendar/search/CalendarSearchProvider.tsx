import {
    MutableRefObject,
    ReactNode,
    createContext,
    useCallback,
    useContext,
    useEffect,
    useRef,
    useState,
} from 'react';
import { useHistory } from 'react-router-dom';

import { ESItem } from '@proton/encrypted-search/lib';
import { useLoading } from '@proton/hooks';
import { VIEWS } from '@proton/shared/lib/calendar/constants';
import noop from '@proton/utils/noop';

import { extractSearchParameters, generatePathnameWithSearchParams } from '../../../helpers/encryptedSearch/esUtils';
import { ESCalendarContent, ESCalendarMetadata, ESCalendarSearchParams } from '../../../interfaces/encryptedSearch';
import { useEncryptedSearchLibrary } from '../../EncryptedSearchLibraryProvider';
import { VisualSearchItem } from './interface';

interface UseCalendarSearch {
    searchParams: ESCalendarSearchParams;
    items: ESItem<ESCalendarMetadata, ESCalendarContent>[];
    search: (params: ESCalendarSearchParams) => void;
    triggerSearch: () => void;
    hasSearchedCounter: number;
    openedSearchItem: VisualSearchItem | undefined;
    setOpenedSearchItem: (item: VisualSearchItem | undefined) => void;
    isSearching: boolean;
    setIsSearching: (isSearching: boolean) => void;
    lastNonSearchViewRef: MutableRefObject<VIEWS | undefined>;
    isIndexing: boolean;
    isActive: boolean;
    disabled: boolean;
    loading: boolean;
}

const CalendarSearchContext = createContext<UseCalendarSearch>({
    searchParams: {},
    items: [],
    search: noop,
    triggerSearch: noop,
    openedSearchItem: undefined,
    setOpenedSearchItem: noop,
    isSearching: false,
    setIsSearching: noop,
    lastNonSearchViewRef: { current: undefined },
    hasSearchedCounter: 0,
    isIndexing: false,
    isActive: false,
    disabled: true,
    loading: false,
});
export const useCalendarSearch = () => useContext(CalendarSearchContext);

interface Props {
    children?: ReactNode;
}
const CalendarSearchProvider = ({ children }: Props) => {
    const history = useHistory();
    const { isLibraryInitialized, encryptedSearch, esStatus } = useEncryptedSearchLibrary();

    const lastNonSearchViewRef = useRef<VIEWS>();
    const [hasSearchedCounter, setHasSearchedCounter] = useState(0);
    const [renderCounter, setRenderCounter] = useState(0);
    // isSearching determines if the UI displays a search bar (if true) or a magnifier button (if false);
    const [isSearching, setIsSearching] = useState(false);
    const [loading, withLoading, setLoading] = useLoading(true);
    const [openedSearchItem, setOpenedSearchItem] = useState<VisualSearchItem>();

    const { dbExists, isEnablingEncryptedSearch, isRefreshing, isMetadataIndexingPaused } = esStatus;

    const isIndexing = isEnablingEncryptedSearch || isRefreshing || isMetadataIndexingPaused;
    const isActive = dbExists && !isIndexing;

    const triggerSearch = useCallback(() => {
        return setRenderCounter((c) => c + 1);
    }, []);

    const searchParams = extractSearchParameters(history.location);
    const keyword = searchParams?.keyword || '';

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
    }, [renderCounter, isLibraryInitialized, keyword]);

    const value = {
        searchParams,
        items,
        search,
        triggerSearch,
        hasSearchedCounter,
        openedSearchItem,
        setOpenedSearchItem,
        isSearching,
        setIsSearching,
        lastNonSearchViewRef,
        isIndexing,
        isActive,
        disabled: !isLibraryInitialized || !isActive,
        loading,
    };

    return <CalendarSearchContext.Provider value={value}>{children}</CalendarSearchContext.Provider>;
};

export default CalendarSearchProvider;
