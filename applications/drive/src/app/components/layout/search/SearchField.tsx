import React, { useCallback, useRef } from 'react';

import { c } from 'ttag';

import { Button, Href, Icon, InputTwo, Spotlight, usePopperAnchor } from '@proton/components';
import { getKnowledgeBaseUrl } from '@proton/shared/lib/helpers/url';
import esSpotlightIcon from '@proton/styles/assets/img/illustrations/spotlight-stars.svg';

import useNavigate from '../../../hooks/drive/useNavigate';
import { useSearchControl } from '../../../store';
import { useSearchResults } from '../../../store/_search';
import { reportError } from '../../../store/_utils';
import { useSpotlight } from '../../useSpotlight';
import { SearchDropdown } from './SearchDropdown';
import { useSearchParams } from './useSearchParams';

import './SearchField.scss';

export const SearchField = () => {
    const indexingDropdownAnchorRef = useRef<HTMLDivElement>(null);
    const indexingDropdownControl = usePopperAnchor<HTMLButtonElement>();
    const { searchSpotlight } = useSpotlight();
    const { dbExists } = useSearchResults();

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

    const handleFieldFocus = () => {
        return prepareSearchData().catch(reportError);
    };

    const handleInputClick = () => {
        if (dbExists && !isBuilding) {
            return;
        }

        searchSpotlight.close();

        if (indexingDropdownControl.isOpen) {
            indexingDropdownControl.close();
            return;
        }
        indexingDropdownControl.open();

        return handleFieldFocus();
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
        <div ref={indexingDropdownAnchorRef} className="searchfield-container">
            <Spotlight
                className="search-spotlight"
                originalPlacement="bottom-left"
                show={shouldShowSpotlight}
                onDisplayed={searchSpotlight.onDisplayed}
                content={
                    <div className="flex flex-nowrap">
                        <figure className="flex-item flex-item-noshrink pr1">
                            {imageProps && <img className="hauto" {...imageProps} alt={imageProps.alt || ''} />}
                        </figure>
                        <div className="flex-item">
                            <div className="text-bold text-lg mauto">{c('Spotlight').t`Encrypted search is here`}</div>
                            {c('Spotlight').t`Now you can easily search Drive files while keeping your data secure.`}
                            <br />
                            <Href url={getKnowledgeBaseUrl('/search-drive')} title="How does encrypted search work?">
                                {c('Info').t`How does encrypted search work?`}
                            </Href>
                        </div>
                    </div>
                }
            >
                <>
                    <div onClick={handleInputClick}>
                        <InputTwo
                            value={searchParams}
                            placeholder={placeholderText}
                            // this handler has to be passed with `onFocus` prop, as before it used to trigger
                            // caching twice in certain cases (the focus stayed on the searchbar after
                            // indexing, the prepareSearchData is not called until the user hits enter
                            // to do the search.)
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
                                    <Icon name="magnifier" alt={c('Action').t`Search`} />
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
                                        }}
                                    >
                                        {c('Action').t`Clear`}
                                    </Button>
                                ) : null
                            }
                        />
                    </div>
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
