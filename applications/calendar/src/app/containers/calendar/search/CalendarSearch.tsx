import { useEffect, useState } from 'react';

import { generateUID, usePopperAnchor } from '@proton/components';

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
    const [uid] = useState(generateUID('advanced-search-overlay'));
    const { anchorRef, isOpen, open, close } = usePopperAnchor<HTMLDivElement>();

    const { cacheIndexedDB } = useEncryptedSearchLibrary();
    const { searchParams, isEnabled, isActive: isSearchActive, loading, setIsSearching } = useCalendarSearch();

    const isSearchEnabled = isEnabled !== false;

    const handleCloseOverlay = () => {
        if (!isSearchActive) {
            close();
            setIsSearching(false);
        }
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
        containerRef.addEventListener('mousedown', handleCloseOverlay, { passive: true });
        containerRef.addEventListener('touchstart', handleCloseOverlay, { passive: true });

        return () => {
            containerRef.removeEventListener('mousedown', handleCloseOverlay);
            containerRef.removeEventListener('touchstart', handleCloseOverlay);
        };
    }, [containerRef, handleCloseOverlay]);

    return (
        <>
            <CalendarSearchInput
                ref={anchorRef}
                value={searchParams.keyword || ''}
                onSearch={onSearch}
                onBack={onBackFromSearch}
                loading={loading}
                isSearchActive={isSearchActive}
            />
            <SearchOverlay id={uid} isOpen={isOpen} anchorRef={anchorRef} onClose={close} disableFocusTrap>
                {!isSearchEnabled && <CalendarSearchActivation onClose={handleCloseOverlay} />}
            </SearchOverlay>
        </>
    );
};

export default CalendarSearch;
