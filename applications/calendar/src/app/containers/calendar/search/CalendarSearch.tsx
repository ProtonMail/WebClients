import { useEffect, useState } from 'react';
import { useHistory } from 'react-router-dom';

import { TopNavbarListItemSearchButton, generateUID, usePopperAnchor, useToggle } from '@proton/components';

import { extractSearchParameters } from '../../../helpers/encryptedSearch/esUtils';
import { useEncryptedSearchLibrary } from '../../EncryptedSearchLibraryProvider';
import AdvancedSearch from './AdvancedSearch';
import CalendarSearchInput from './CalendarSearchInput';
import { useCalendarSearch } from './CalendarSearchProvider';
import SearchOverlay from './SearchOverlay';

import './SearchOverlay.scss';

interface Props {
    isNarrow: boolean;
    containerRef: HTMLDivElement | null;
    onSearch: () => void;
    onBackFromSearch: () => void;
}

const CalendarSearch = ({ isNarrow, containerRef, onSearch, onBackFromSearch }: Props) => {
    const history = useHistory();
    const [uid] = useState(generateUID('advanced-search-overlay'));
    const { anchorRef, isOpen, open, close } = usePopperAnchor<HTMLInputElement>();
    const searchParams = extractSearchParameters(history.location);
    const [searchInputValue, setSearchInputValue] = useState(searchParams.keyword || '');

    const { cacheIndexedDB } = useEncryptedSearchLibrary();
    const { isActive, isIndexing, loading } = useCalendarSearch();
    // Show more from inside AdvancedSearch to persist the state when the overlay is closed
    const { state: showMore, toggle: toggleShowMore } = useToggle(false);

    const keyword = searchParams?.keyword || '';

    const handleOpen = () => {
        if (isOpen) {
            return;
        }

        anchorRef.current?.blur();
        void cacheIndexedDB();
        open();
    };

    useEffect(() => {
        setSearchInputValue(keyword);
        if (keyword) {
            onSearch();
        }
        close();
    }, [keyword]);

    return (
        <>
            {isNarrow ? (
                <TopNavbarListItemSearchButton onClick={handleOpen} />
            ) : (
                <CalendarSearchInput
                    ref={anchorRef}
                    value={searchInputValue}
                    onOpen={handleOpen}
                    onClear={onBackFromSearch}
                    loading={loading}
                />
            )}
            <SearchOverlay id={uid} isOpen={isOpen} anchorRef={anchorRef} onClose={close}>
                <AdvancedSearch
                    isNarrow={isNarrow}
                    containerRef={containerRef}
                    isIndexing={isIndexing}
                    isSearchActive={isActive}
                    onClose={close}
                    showMore={showMore}
                    toggleShowMore={toggleShowMore}
                    searchInputValue={searchInputValue}
                />
            </SearchOverlay>
        </>
    );
};

export default CalendarSearch;
