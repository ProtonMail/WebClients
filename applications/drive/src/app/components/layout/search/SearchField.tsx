import { useCallback, useRef } from 'react';

import { c } from 'ttag';

import { Button } from '@proton/atoms/Button/Button';
import { Href } from '@proton/atoms/Href/Href';
import { Input } from '@proton/atoms/Input/Input';
import { Spotlight, usePopperAnchor } from '@proton/components';
import { useSearchTelemetry } from '@proton/encrypted-search/lib/useSearchTelemetry';
import { IcMagnifier } from '@proton/icons/icons/IcMagnifier';
import { getKnowledgeBaseUrl } from '@proton/shared/lib/helpers/url';
import esSpotlightIcon from '@proton/styles/assets/img/illustrations/spotlight-stars.svg';

import useDriveNavigation from '../../../hooks/drive/useNavigate';
import { useSearchControl } from '../../../store';
import { useSearchResults } from '../../../store/_search';
import { sendErrorReport } from '../../../utils/errorHandling';
import { useSpotlight } from '../../useSpotlight';
import { SearchDropdown } from './SearchDropdown';
import { useSearchParams } from './useSearchParams';

import './SearchField.scss';

export const SearchField = () => {
    const indexingDropdownAnchorRef = useRef<HTMLDivElement>(null);
    const indexingDropdownControl = usePopperAnchor<HTMLButtonElement>();
    const { searchSpotlight } = useSpotlight();
    const { dbExists } = useSearchResults();
    const { sendClearSearchFieldsReport } = useSearchTelemetry();

    const navigation = useDriveNavigation();
    const { searchEnabled, isEnablingEncryptedSearch, isDisabled, disabledReason, prepareSearchData } =
        useSearchControl();
    const [searchParams, setSearchParams] = useSearchParams();

    const handleSearch = useCallback((keyword = '') => {
        const encodedKeyword = encodeURIComponent(keyword);
        if (keyword.length !== 0) {
            navigation.navigateToSearch(encodedKeyword);
        } else {
            navigation.navigateToRoot();
        }
    }, []);

    const handleFieldFocus = () => {
        if (dbExists && !isEnablingEncryptedSearch) {
            return;
        }

        searchSpotlight.close();

        if (indexingDropdownControl.isOpen) {
            indexingDropdownControl.close();
            return;
        }
        indexingDropdownControl.open();
        return prepareSearchData().catch(sendErrorReport);
    };

    const handleClosedDropdown = (e?: Event) => {
        e?.stopPropagation();
        indexingDropdownControl.close();
    };

    if (!searchEnabled) {
        return null;
    }

    const placeholderText = isDisabled ? disabledReason : c('Action').t`Search drive`;
    const imageProps = { src: esSpotlightIcon, alt: c('Info').t`Encrypted search is here` };
    const shouldShowSpotlight = searchSpotlight.isOpen && !indexingDropdownControl.isOpen;

    return (
        <div ref={indexingDropdownAnchorRef} className="searchfield-container searchbox">
            {
                // On Firefox, no event is fired when the input field is disabled.
                // This is a small "hack" to open the spotlight when the user clicks on the disabled input.
            }
            {isEnablingEncryptedSearch ? (
                <button
                    className="searchfield-disabled-input-button"
                    aria-label={c('Label').t`Show indexing progress of Encrypted Search`}
                    onClick={() => indexingDropdownControl.open()}
                />
            ) : null}
            <Spotlight
                className="search-spotlight"
                originalPlacement="bottom-start"
                show={shouldShowSpotlight}
                onDisplayed={searchSpotlight.onDisplayed}
                content={
                    <div className="flex flex-nowrap">
                        <figure className="shrink-0 pr-4">
                            {imageProps && <img className="h-auto" {...imageProps} alt={imageProps.alt || ''} />}
                        </figure>
                        <div>
                            <div className="text-bold text-lg m-auto">{c('Spotlight').t`Encrypted search is here`}</div>
                            {c('Spotlight').t`Now you can easily search Drive files while keeping your data secure.`}
                            <br />
                            <Href href={getKnowledgeBaseUrl('/search-drive')} title="How does encrypted search work?">
                                {c('Info').t`How does encrypted search work?`}
                            </Href>
                        </div>
                    </div>
                }
            >
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
                        disabled={isDisabled}
                        prefix={
                            <Button
                                icon
                                disabled={!searchParams || isDisabled}
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
                        suffix={
                            searchParams ? (
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
                                        sendClearSearchFieldsReport(true);
                                    }}
                                >
                                    {c('Action').t`Clear`}
                                </Button>
                            ) : null
                        }
                    />
                    <SearchDropdown
                        isOpen={indexingDropdownControl.isOpen}
                        anchorRef={indexingDropdownAnchorRef}
                        onClose={handleClosedDropdown}
                        onClosed={handleClosedDropdown}
                    />
                </>
            </Spotlight>
        </div>
    );
};
