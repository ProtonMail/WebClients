import { useCallback, useEffect, useRef, useState } from 'react';

import { c } from 'ttag';

import { Button } from '@proton/atoms/Button/Button';
import { Input } from '@proton/atoms/Input/Input';
import { usePopperAnchor } from '@proton/components';
import { IcMagnifier } from '@proton/icons/icons/IcMagnifier';

import { useSpotlight } from '../../../components/useSpotlight';
import useDriveNavigation from '../../../hooks/drive/useNavigate';
import { type UseSearchModuleReturn, useSearchModule } from '../../../hooks/search/useSearchModule';
import { useUrlSearchParams } from '../../../hooks/search/useUrlSearchParam';
import { tryCatchWithNotification } from '../../../modules/search';
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

    const handleSearch = useCallback((keyword = '') => {
        const encodedKeyword = encodeURIComponent(keyword);
        if (keyword.length !== 0) {
            navigation.navigateToSearch(encodedKeyword);
        } else {
            navigation.navigateToRoot();
        }
    }, []);

    const handleFieldFocus = () => {
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

    const suffix = searchParams ? (
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
                    isInitialIndexing={searchModule.isInitialIndexing}
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
