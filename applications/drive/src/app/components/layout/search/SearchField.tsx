import { useEffect, useRef, useCallback } from 'react';
import { c } from 'ttag';

import { Searchbox, usePopperAnchor } from '@proton/components';

import { useSearchControl } from '../../../store';
import useNavigate from '../../../hooks/drive/useNavigate';
import { SearchDropdown } from './SearchDropdown';
import { useSearchParams } from './useSearchParams';

import './SearchField.scss';

export const SearchField = () => {
    const indexingDropdownAnchorRef = useRef<HTMLDivElement>(null);
    const indexingDropdownControl = usePopperAnchor<HTMLButtonElement>();

    const navigation = useNavigate();
    const { searchEnabled, isBuilding, isDisabled, disabledReason, prepareSearchData } = useSearchControl();
    const [searchParams, setSearchParams] = useSearchParams();

    const handleSearch = useCallback((keyword = '') => {
        const encodedKeyword = encodeURIComponent(keyword);
        if (keyword.length !== 0) {
            navigation.navigateToSearch(encodedKeyword);
        } else {
            navigation.navigateToRoot();
        }
    }, []);

    const handleFocus = () => {
        void prepareSearchData(() => indexingDropdownControl.open());
    };

    useEffect(() => {
        if (!isBuilding) {
            indexingDropdownControl.close();
        }
    }, [isBuilding]);

    if (!searchEnabled) {
        return null;
    }

    const placeholderText = isDisabled ? disabledReason : c('Action').t`Search drive`;

    return (
        <div ref={indexingDropdownAnchorRef} className="searchfield-container">
            <Searchbox
                delay={0}
                className="w100"
                placeholder={placeholderText}
                value={searchParams}
                onSearch={handleSearch}
                onChange={setSearchParams}
                disabled={isDisabled}
                onFocus={handleFocus}
                advanced={
                    indexingDropdownControl.isOpen && (
                        <SearchDropdown
                            isOpen={indexingDropdownControl.isOpen}
                            anchorRef={indexingDropdownAnchorRef}
                            onClose={indexingDropdownControl.close}
                            onClosed={indexingDropdownControl.close}
                        />
                    )
                }
            />
        </div>
    );
};
