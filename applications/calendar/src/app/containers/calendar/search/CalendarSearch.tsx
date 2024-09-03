import { useEffect, useRef, useState } from 'react';

import { usePopperAnchor } from '@proton/components';
import generateUID from '@proton/utils/generateUID';

import { useEncryptedSearchLibrary } from '../../EncryptedSearchLibraryProvider';
import CalendarSearchActivation from './CalendarSearchActivation';
import CalendarSearchInput from './CalendarSearchInput';
import { useCalendarSearch } from './CalendarSearchProvider';
import SearchOverlay from './SearchOverlay';

import './SearchOverlay.scss';

interface Props {
    containerRef: HTMLDivElement | null;
    onSearch: () => void;
    onBackFromSearch: () => void;
}

const CalendarSearch = ({ containerRef, onSearch, onBackFromSearch }: Props) => {
    const searchRef = useRef<HTMLDivElement>(null);
    const [uid] = useState(generateUID('advanced-search-overlay'));
    const { anchorRef, isOpen, open, close } = usePopperAnchor<HTMLDivElement>();

    const { cacheIndexedDB } = useEncryptedSearchLibrary();
    const {
        searchParams,
        isEnabled,
        isActive: isSearchActive,
        loading,
        setIsSearching,
        setSearchInput,
        searchInput,
    } = useCalendarSearch();

    const isSearchEnabled = isEnabled !== false;

    const handleCloseSearch = (e: MouseEvent | TouchEvent) => {
        // Close the overlay
        close();

        const clickedOutsideSearch = searchRef.current && !searchRef.current.contains(e.target as Node);

        // Show regular calendar header when user is not searching for event results and clicking outside search
        if (!searchParams.keyword && clickedOutsideSearch) {
            setIsSearching(false);
        }
    };

    const handleCloseOverlay = () => {
        close();

        setIsSearching(false);
    };

    useEffect(() => {
        void cacheIndexedDB();
    }, []);

    useEffect(() => {
        if (!isOpen && !isSearchEnabled) {
            open();
        }
        if (isOpen && isSearchEnabled) {
            close();
        }
    }, [isOpen, isSearchEnabled]);

    useEffect(() => {
        if (!containerRef) {
            return;
        }
        containerRef.addEventListener('mousedown', handleCloseSearch, { passive: true });
        containerRef.addEventListener('touchstart', handleCloseSearch, { passive: true });

        return () => {
            containerRef.removeEventListener('mousedown', handleCloseSearch);
            containerRef.removeEventListener('touchstart', handleCloseSearch);
        };
    }, [containerRef, handleCloseSearch]);

    return (
        <>
            <CalendarSearchInput
                value={searchInput}
                setValue={setSearchInput}
                ref={anchorRef}
                onSearch={onSearch}
                onBack={onBackFromSearch}
                loading={loading}
                isSearchActive={isSearchActive}
                searchRef={searchRef}
            />
            <SearchOverlay id={uid} isOpen={isOpen} anchorRef={anchorRef} onClose={handleCloseOverlay} disableFocusTrap>
                {!isSearchEnabled && <CalendarSearchActivation onClose={handleCloseOverlay} />}
            </SearchOverlay>
        </>
    );
};

export default CalendarSearch;
