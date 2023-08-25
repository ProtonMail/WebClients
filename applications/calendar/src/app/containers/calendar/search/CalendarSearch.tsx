import { useEffect, useState } from 'react';

import { c } from 'ttag';

import { Icon, ToolbarButton, generateUID, usePopperAnchor, useToggle } from '@proton/components';

import { useEncryptedSearchLibrary } from '../../EncryptedSearchLibraryProvider';
import AdvancedSearch from './AdvancedSearch';
import CalendarSearchInput from './CalendarSearchInput';
import { useCalendarSearch } from './CalendarSearchProvider';
import SearchOverlay from './SearchOverlay';

import './SearchOverlay.scss';

interface Props {
    isNarrow: boolean;
    showSearchField: boolean;
    containerRef: HTMLDivElement | null;
    onSearch: () => void;
    onBackFromSearch: () => void;
}

const CalendarSearch = ({ isNarrow, showSearchField, containerRef, onSearch, onBackFromSearch }: Props) => {
    const [uid] = useState(generateUID('advanced-search-overlay'));
    const { anchorRef, isOpen, open, close } = usePopperAnchor<HTMLButtonElement>();

    const { cacheIndexedDB } = useEncryptedSearchLibrary();
    const { searchParams, isActive, isIndexing, loading } = useCalendarSearch();
    const keyword = searchParams.keyword || '';

    const [searchInputValue, setSearchInputValue] = useState(keyword);
    // Show more from inside AdvancedSearch to persist the state when the overlay is closed
    const { state: showMore, toggle: toggleShowMore } = useToggle(false);

    const handleOpen = () => {
        if (isOpen) {
            return;
        }

        anchorRef.current?.blur();
        void cacheIndexedDB();
        open();
    };

    const handleClear = () => {
        setSearchInputValue('');
        open();
    };

    useEffect(() => {
        setSearchInputValue(keyword);
    }, [keyword]);

    return (
        <>
            {showSearchField ? (
                <CalendarSearchInput
                    ref={anchorRef}
                    value={searchInputValue}
                    onOpen={handleOpen}
                    onClear={handleClear}
                    onBack={onBackFromSearch}
                    loading={loading}
                />
            ) : (
                <ToolbarButton
                    icon={<Icon name="magnifier" />}
                    title={c('Header').t`Search`}
                    onClick={handleOpen}
                    ref={anchorRef}
                />
            )}
            <SearchOverlay id={uid} isOpen={isOpen} anchorRef={anchorRef} onClose={close}>
                <AdvancedSearch
                    searchInputParams={{ keyword: searchInputValue }}
                    isNarrow={isNarrow}
                    containerRef={containerRef}
                    isIndexing={isIndexing}
                    isSearchActive={isActive}
                    onSearch={onSearch}
                    onClose={close}
                    showMore={showMore}
                    toggleShowMore={toggleShowMore}
                />
            </SearchOverlay>
        </>
    );
};

export default CalendarSearch;
