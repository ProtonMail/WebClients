import { type RefObject, useEffect, useRef, useState } from 'react';

import usePopperAnchor from '@proton/components/components/popper/usePopperAnchor';
import generateUID from '@proton/utils/generateUID';

import { useEncryptedSearchLibrary } from '../../EncryptedSearchLibraryProvider';
import CalendarSearchActivation from './CalendarSearchActivation';
import CalendarSearchInput from './CalendarSearchInput';
import { useCalendarSearch } from './CalendarSearchProvider';
import SearchOverlay from './SearchOverlay';

import './SearchOverlay.scss';

interface Props {
    containerRef: RefObject<HTMLDivElement>;
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

    // eslint-disable-next-line react-hooks/exhaustive-deps -- autofix-eslint-33D7F4
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
        // eslint-disable-next-line react-hooks/exhaustive-deps -- autofix-eslint-A73122
    }, []);

    useEffect(() => {
        if (!isOpen && !isSearchEnabled) {
            open();
        }
        if (isOpen && isSearchEnabled) {
            close();
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps -- autofix-eslint-CA8C11
    }, [isOpen, isSearchEnabled]);

    useEffect(() => {
        if (!containerRef.current) {
            return;
        }
        containerRef.current.addEventListener('mousedown', handleCloseSearch, { passive: true });
        containerRef.current.addEventListener('touchstart', handleCloseSearch, { passive: true });

        return () => {
            if (!containerRef.current) {
                return;
            }
            containerRef.current.removeEventListener('mousedown', handleCloseSearch);
            // eslint-disable-next-line react-hooks/exhaustive-deps -- autofix-eslint-DC17E1
            containerRef.current.removeEventListener('touchstart', handleCloseSearch);
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
