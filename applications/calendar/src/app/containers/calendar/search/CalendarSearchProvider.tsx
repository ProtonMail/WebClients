import { ReactNode, createContext, useCallback, useContext, useEffect, useState } from 'react';
import { useHistory } from 'react-router-dom';

import { useLoading } from '@proton/components/hooks';
import { ESItem } from '@proton/encrypted-search/lib';
import noop from '@proton/utils/noop';

import { extractSearchParametersFromURL } from '../../../helpers/encryptedSearch/esUtils';
import { ESCalendarContent, ESCalendarMetadata } from '../../../interfaces/encryptedSearch';
import { useEncryptedSearchLibrary } from '../../EncryptedSearchLibraryProvider';

interface UseCalendarSearch {
    keyword: string;
    items: ESItem<ESCalendarMetadata, ESCalendarContent>[];
    triggerSearch: () => void;
    hasSearchedCounter: number;
    isIndexing: boolean;
    isActive: boolean;
    disabled: boolean;
    loading: boolean;
}

const CalendarSearchContext = createContext<UseCalendarSearch>({
    keyword: '',
    items: [],
    triggerSearch: noop,
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
    const { isLibraryInitialized, encryptedSearch, getESDBStatus } = useEncryptedSearchLibrary();

    const [hasSearchedCounter, setHasSearchedCounter] = useState(0);
    const [renderCounter, setRenderCounter] = useState(0);
    const [loading, withLoading] = useLoading();

    const { dbExists, isEnablingEncryptedSearch, isRefreshing, isMetadataIndexingPaused } = getESDBStatus();

    const isIndexing = isEnablingEncryptedSearch || isRefreshing || isMetadataIndexingPaused;
    const isActive = dbExists && !isIndexing;

    const triggerSearch = useCallback(() => {
        return setRenderCounter((c) => c + 1);
    }, []);

    const searchParams = extractSearchParametersFromURL(history.location);
    const keyword = searchParams?.keyword || '';

    const [items, setItems] = useState<ESItem<ESCalendarMetadata, ESCalendarContent>[]>([]);

    useEffect(() => {
        if (!isLibraryInitialized || !keyword) {
            return;
        }
        void withLoading(
            encryptedSearch(setItems).then(() => {
                setHasSearchedCounter((c) => c + 1);
            })
        );
    }, [renderCounter, isLibraryInitialized, keyword]);

    const value = {
        keyword,
        items,
        triggerSearch,
        hasSearchedCounter,
        isIndexing,
        isActive,
        disabled: !isLibraryInitialized || !isActive,
        loading,
    };

    return <CalendarSearchContext.Provider value={value}>{children}</CalendarSearchContext.Provider>;
};

export default CalendarSearchProvider;
