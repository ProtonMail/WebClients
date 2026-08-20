import { useCallback, useEffect, useRef, useState } from 'react';

import { c } from 'ttag';

import { Button } from '@proton/atoms/Button/Button';
import { CircleLoader } from '@proton/atoms/CircleLoader/CircleLoader';
import { Input } from '@proton/atoms/Input/Input';
import { usePopperAnchor } from '@proton/atoms/Popper/usePopperAnchor';
import { IcMagnifier } from '@proton/icons/icons/IcMagnifier';

import { useSpotlight } from '../../../legacy/components/useSpotlight';
import useDriveNavigation from '../../../legacy/hooks/drive/useNavigate';
import {
    type UseSearchModuleReturn,
    tryCatchWithNotification,
    useSearchModule,
    useUrlSearchParams,
} from '../../../modules/search';
import { SearchDropdown } from './SearchDropdown';

type SearchFieldInnerProps = {
    searchModule: Extract<UseSearchModuleReturn, { isAvailable: true }>;
};

const SearchFieldInner = ({ searchModule }: SearchFieldInnerProps) => {
    const indexingDropdownAnchorRef = useRef<HTMLDivElement>(null);
    const indexingDropdownControl = usePopperAnchor<HTMLButtonElement>();
    const { searchSpotlight } = useSpotlight();

    const navigation = useDriveNavigation();
    const [searchParams, setSearchParams] = useUrlSearchParams();

    const hasPermanentError = searchModule.permanentError !== null;
    // Auto-open the dropdown on a new permanent error, but allow Dismiss to close it
    // until a fresh error kind comes in.
    const [isErrorDismissed, setIsErrorDismissed] = useState(false);
    useEffect(() => {
        if (searchModule.permanentError) {
            setIsErrorDismissed(false);
        }
    }, [searchModule.permanentError]);

    // Open the re-indexing dropdown on focus only once per re-index episode. Reset when the
    // episode ends so a later re-index can show it once again; the spinner button reopens it.
    const isReindexing = searchModule.isIndexing && searchModule.isSearchable;
    const reindexShownRef = useRef(false);
    useEffect(() => {
        if (!isReindexing) {
            reindexShownRef.current = false;
        }
    }, [isReindexing]);

    const handleSearch = useCallback((keyword = '') => {
        const encodedKeyword = encodeURIComponent(keyword);
        if (keyword.length !== 0) {
            navigation.navigateToSearch(encodedKeyword);
        } else {
            navigation.navigateToRoot();
        }
    }, []);

    const handleFieldFocus = () => {
        // Re-indexing in the background: open the info dropdown on the first focus of this
        // episode (the field stays searchable). The spinner button reopens it afterwards.
        if (isReindexing) {
            if (!reindexShownRef.current) {
                reindexShownRef.current = true;
                indexingDropdownControl.open();
            }
            return;
        }

        // A usable index exists and nothing is re-indexing - let the user search, no dropdown.
        if (searchModule.isSearchable) {
            return;
        }

        searchSpotlight.close();

        if (indexingDropdownControl.isOpen) {
            indexingDropdownControl.close();
            return;
        }
        indexingDropdownControl.open();

        if (searchModule.isRunningOutdatedVersion) {
            return;
        }

        void tryCatchWithNotification(searchModule.optIn)();
    };

    const handleClosedDropdown = (e?: Event) => {
        e?.stopPropagation();
        indexingDropdownControl.close();
        setIsErrorDismissed(true);
    };

    const placeholderText = hasPermanentError ? c('Action').t`Search is unavailable` : c('Action').t`Search drive`;
    const isReadonly = !(searchModule.isSearchable && !searchModule.isRunningOutdatedVersion);

    const clearButton = searchParams ? (
        <Button
            type="button"
            shape="ghost"
            color="weak"
            size="small"
            className="rounded-sm"
            title={c('Action').t`Clear`}
            onClick={() => {
                setSearchParams('');
                handleSearch('');
            }}
        >
            {c('Action').t`Clear`}
        </Button>
    ) : null;

    // Shown only while re-indexing: a spinner that reopens the re-indexing info dropdown.
    const reindexButton = isReindexing ? (
        <Button
            icon
            type="button"
            shape="ghost"
            color="weak"
            size="small"
            className="rounded-sm"
            title={c('Action').t`Re-indexing in progress`}
            onClick={() => indexingDropdownControl.open()}
        >
            <CircleLoader size="small" />
        </Button>
    ) : null;

    const suffix =
        reindexButton || clearButton ? (
            <>
                {reindexButton}
                {clearButton}
            </>
        ) : null;

    return (
        <div ref={indexingDropdownAnchorRef} className="searchfield-container searchbox">
            <>
                <Input
                    value={searchParams}
                    placeholder={placeholderText}
                    onFocus={handleFieldFocus}
                    onChange={(e) => setSearchParams(e.target.value)}
                    onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                            handleSearch(searchParams);
                        }
                        if (e.key === 'Escape') {
                            setSearchParams('');
                            e.currentTarget.blur();
                        }
                    }}
                    readOnly={isReadonly}
                    prefix={
                        <Button
                            icon
                            disabled={!searchParams && !isReadonly}
                            shape="ghost"
                            color="weak"
                            size="small"
                            className="rounded-sm"
                            title={c('Action').t`Search`}
                            onClick={() => {
                                handleSearch(searchParams);
                            }}
                        >
                            <IcMagnifier alt={c('Action').t`Search`} />
                        </Button>
                    }
                    suffix={suffix}
                />
                <SearchDropdown
                    isOpen={indexingDropdownControl.isOpen || (hasPermanentError && !isErrorDismissed)}
                    anchorRef={indexingDropdownAnchorRef}
                    onClose={handleClosedDropdown}
                    onClosed={handleClosedDropdown}
                    isSearchable={searchModule.isSearchable}
                    isIndexing={searchModule.isIndexing}
                    isRunningOutdatedAppVersion={searchModule.isRunningOutdatedVersion}
                    indexingProgress={searchModule.indexingProgress}
                    permanentError={searchModule.permanentError}
                    rebuild={searchModule.rebuild}
                />
            </>
        </div>
    );
};

export const SearchField = () => {
    const searchModule = useSearchModule();

    if (!searchModule.isAvailable) {
        return null;
    }

    return <SearchFieldInner searchModule={searchModule} />;
};
