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

const CalendarSearch = ({ onSearch, onBackFromSearch }: Props) => {
    const [uid] = useState(generateUID('advanced-search-overlay'));
    const { anchorRef, isOpen, open, close } = usePopperAnchor<HTMLDivElement>();

    const { cacheIndexedDB } = useEncryptedSearchLibrary();
    const { searchParams, isActive: isSearchActive, loading } = useCalendarSearch();

    useEffect(() => {
        void cacheIndexedDB();

        if (!isSearchActive) {
            open();
        }
    }, []);

    useEffect(() => {
        if (isOpen && isSearchActive) {
            close();
        }
    }, [isOpen, isSearchActive]);

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
            <SearchOverlay id={uid} isOpen={isOpen} anchorRef={anchorRef} onClose={close}>
                {!isSearchActive && <CalendarSearchActivation onClose={close} />}
            </SearchOverlay>
        </>
    );
};

export default CalendarSearch;
