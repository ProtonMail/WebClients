import React, { useRef, useCallback } from 'react';
import { c } from 'ttag';

import { Href, Searchbox, Spotlight, usePopperAnchor } from '@proton/components';
import { getKnowledgeBaseUrl } from '@proton/shared/lib/helpers/url';
import esSpotlightIcon from '@proton/styles/assets/img/illustrations/spotlight-stars.svg';

import { useSearchControl } from '../../../store';
import useNavigate from '../../../hooks/drive/useNavigate';
import { SearchDropdown } from './SearchDropdown';
import { useSearchParams } from './useSearchParams';
import { useSpotlight } from '../../useSpotlight';
import { reportError } from '../../../store/_utils';
import { useSearchResults } from '../../../store/_search';

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

    const handleInputClick = () => {
        if (dbExists && !isBuilding) {
            return prepareSearchData();
        }

        searchSpotlight.close();
        prepareSearchData().catch(reportError);
        indexingDropdownControl.open();
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
                <div onClick={handleInputClick}>
                    <Searchbox
                        delay={0}
                        className="w100"
                        placeholder={placeholderText}
                        value={searchParams}
                        onSearch={handleSearch}
                        onChange={setSearchParams}
                        disabled={isDisabled}
                        advanced={
                            indexingDropdownControl.isOpen && (
                                <SearchDropdown
                                    isOpen={true}
                                    anchorRef={indexingDropdownAnchorRef}
                                    onClose={handleClosedDropdown}
                                    onClosed={handleClosedDropdown}
                                />
                            )
                        }
                    />
                </div>
            </Spotlight>
        </div>
    );
};
