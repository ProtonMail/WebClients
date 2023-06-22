import { useEffect, useState } from 'react';
import { useHistory } from 'react-router-dom';

import { TopNavbarListItemSearchButton, generateUID, usePopperAnchor, useToggle } from '@proton/components';

import { extractSearchParametersFromURL } from '../../../helpers/encryptedSearch/esUtils';
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
}

const CalendarSearch = ({ isNarrow, containerRef, onSearch }: Props) => {
    const history = useHistory();
    const [uid] = useState(generateUID('advanced-search-overlay'));
    const { anchorRef, isOpen, open, close } = usePopperAnchor<HTMLInputElement>();
    const searchParams = extractSearchParametersFromURL(history.location);
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
            {/*<MailSearchSpotlight canShow={showEncryptedSearch && !isOpen}>*/}
            {isNarrow ? (
                <TopNavbarListItemSearchButton onClick={handleOpen} />
            ) : (
                <CalendarSearchInput
                    ref={anchorRef}
                    value={searchInputValue}
                    onChange={setSearchInputValue}
                    onOpen={handleOpen}
                    loading={loading}
                />
            )}
            {/*</MailSearchSpotlight>*/}
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
