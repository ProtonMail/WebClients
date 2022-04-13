import { useEffect, useRef, useCallback } from 'react';
import { c } from 'ttag';

import { Href, Searchbox, Spotlight, usePopperAnchor } from '@proton/components';
// TODO: replace this with placeholders/star.svg icon after April 2022
import esSpotlightIcon from '@proton/styles/assets/img/onboarding/drive-search-spotlight.svg';

import { useSearchControl } from '../../../store';
import useNavigate from '../../../hooks/drive/useNavigate';
import { SearchDropdown } from './SearchDropdown';
import { useSearchParams } from './useSearchParams';
import { useSpotlight } from '../../useSpotlight';

import './SearchField.scss';
import { reportError } from '../../../store/utils';

export const SearchField = () => {
    const indexingDropdownAnchorRef = useRef<HTMLDivElement>(null);
    const indexingDropdownControl = usePopperAnchor<HTMLButtonElement>();
    const { searchSpotlight } = useSpotlight();

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

    useEffect(() => {
        if (!isBuilding) {
            indexingDropdownControl.close();
        }
    }, [isBuilding]);

    const handleFocus = () => {
        searchSpotlight.close();
        prepareSearchData(() => indexingDropdownControl.open()).catch(reportError);
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
                            <Href
                                // TODO: update domain name later???
                                url="https://protonmail.com/support/knowledge-base/search-drive"
                                title="How does encrypted search work?"
                            >
                                {c('Info').t`How does encrypted search work?`}
                            </Href>
                        </div>
                    </div>
                }
            >
                <div>
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
            </Spotlight>
        </div>
    );
};
