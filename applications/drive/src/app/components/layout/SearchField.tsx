import * as React from 'react';
import { c } from 'ttag';

import { Searchbox, usePopperAnchor } from '@proton/components';
import { ENCRYPTED_SEARCH_ENABLED } from '@proton/shared/lib/drive/constants';

import { useSearchIndexingContext } from '../search/indexing/SearchIndexingProvider';
import useNavigate from '../../hooks/drive/useNavigate';
import { useSearchResultsStorage } from '../search/SearchResultsStorage';
import { useSearchParams } from '../search/useSearchParams';
import { SearchDropdown } from './SearchDropdown';

import './SearchField.scss';

export const SearchField = () => {
    const { isOpen, toggle } = usePopperAnchor<HTMLButtonElement>();
    const { cacheIndexedDB, getESDBStatus, resumeIndexing } = useSearchIndexingContext();
    const { dbExists, isBuilding } = getESDBStatus();
    const navigation = useNavigate();
    const esStorage = useSearchResultsStorage();
    const [searchParams, setSearchParams] = useSearchParams();
    const [value, setValue] = React.useState(searchParams);
    const [isDisabled, setIsDisabled] = React.useState(isBuilding);
    const anchorRef = React.useRef<HTMLDivElement>(null);
    const [shouldInsertDropdown, setShouldInsertDropdown] = React.useState(!dbExists);

    const handleSearch = React.useCallback(
        (keyword = '') => {
            const encodedKeyword = encodeURIComponent(keyword);
            if (keyword.length !== 0) {
                navigation.navigateToSearch(encodedKeyword);
                return esStorage.runSearch();
            }

            navigation.navigateToRoot();
        },
        [esStorage]
    );

    const handleFocus = () => {
        if (dbExists) {
            return cacheIndexedDB();
        }

        setShouldInsertDropdown(true);
        toggle();
        setIsDisabled(true);
        resumeIndexing()
            .then(() => setIsDisabled(false))
            .catch(console.warn);
    };

    React.useEffect(() => {
        if (searchParams !== value) {
            setValue(searchParams);
        }
    }, [searchParams]);

    React.useEffect(() => {
        setShouldInsertDropdown(false);
    }, [setShouldInsertDropdown, dbExists]);

    if (!ENCRYPTED_SEARCH_ENABLED) {
        return null;
    }

    const onClose = () => {
        toggle();
    };

    const handleClosedDropdown = () => {
        setShouldInsertDropdown(false);
    };

    const placeholderText = isDisabled ? c('Info').t`Indexing search results...` : c('Action').t`Search drive`;

    return (
        <div ref={anchorRef} className="searchfield-container">
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
                    shouldInsertDropdown && (
                        <SearchDropdown
                            isOpen={isOpen}
                            anchorRef={anchorRef}
                            onClose={onClose}
                            onClosed={handleClosedDropdown}
                        />
                    )
                }
            />
        </div>
    );
};
