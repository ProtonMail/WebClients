import { FormEvent, MouseEvent, Ref, forwardRef, useRef, useState } from 'react';

import { isBefore, sub } from 'date-fns';
import { c } from 'ttag';

import { Button, Href, Input } from '@proton/atoms';
import { Icon } from '@proton/components/components/icon';
import { Spotlight, useSpotlightShow } from '@proton/components/components/spotlight';
import { ToolbarButton } from '@proton/components/components/toolbar';
import { FeatureCode } from '@proton/components/containers/features';
import { useActiveBreakpoint, useSpotlightOnFeature, useUser, useWelcomeFlags } from '@proton/components/hooks';
import { SECOND } from '@proton/shared/lib/constants';
import { getKnowledgeBaseUrl } from '@proton/shared/lib/helpers/url';

import { useCalendarSearch } from './CalendarSearchProvider';

interface Props {
    value: string;
    loading: boolean;
    onSearch: () => void;
    onBack: () => void;
    isSearchActive: boolean;
}

const CalendarSearchInput = (
    { value: inputValue, loading, onSearch, onBack, isSearchActive }: Props,
    ref: Ref<HTMLDivElement>
) => {
    const [user] = useUser();
    const [{ isWelcomeFlow }] = useWelcomeFlags();
    const { isNarrow } = useActiveBreakpoint();
    const { search } = useCalendarSearch();

    const inputRef = useRef<HTMLInputElement>(null);
    const spotlightAnchorRef = useRef<HTMLButtonElement>(null);

    const [keyword, setKeyWord] = useState(inputValue);

    const {
        show: showCalendarEsSpotlight,
        onDisplayed: onSpotlightDisplayed,
        onClose: onCloseSpotlight,
    } = useSpotlightOnFeature(
        FeatureCode.CalendarEncryptedSearchSpotlight,
        isBefore(new Date(user.CreateTime * SECOND), sub(new Date(), { weeks: 1 })) && !isNarrow && !isWelcomeFlow,
        // TODO: update
        {
            alpha: Date.UTC(2022, 4, 25, 12),
            beta: Date.UTC(2022, 4, 25, 12),
            default: Date.UTC(2022, 4, 25, 12),
        }
    );

    const shouldShowCalendarEsSpotlight = useSpotlightShow(showCalendarEsSpotlight);

    const handleChange = (event: FormEvent<HTMLInputElement>) => {
        setKeyWord(event.currentTarget.value);
    };

    const handleClear = () => {
        setKeyWord('');
        inputRef.current?.focus();
    };

    const handleSearch = () => {
        const trimmedKeyword = keyword.trim();

        if (!trimmedKeyword) {
            return;
        }

        search({
            keyword: keyword.trim(),
        });
        onSearch();
    };

    const handleBack = (event: MouseEvent<HTMLButtonElement>) => {
        event.stopPropagation();
        onBack();
    };

    const handleFocus = () => {
        // close spotlight if it's on display
        if (shouldShowCalendarEsSpotlight) {
            onCloseSpotlight();
        }
    };

    return (
        <>
            <ToolbarButton
                icon={<Icon name="arrow-left" alt={c('Action').t`Back`} />}
                className="mr-2"
                onClick={handleBack}
            />
            <div className="flex flex-nowrap gap-2">
                <div
                    className="searchbox flex max-w-custom"
                    role="search"
                    style={{ '--max-w-custom': '360px' }}
                    ref={ref}
                >
                    <div className="w100 m-auto">
                        <Spotlight
                            originalPlacement="bottom-start"
                            show={shouldShowCalendarEsSpotlight}
                            onDisplayed={onSpotlightDisplayed}
                            type="new"
                            anchorRef={spotlightAnchorRef}
                            content={
                                <>
                                    <div className="text-lg text-bold mb-1">{c('Spotlight').t`Search for events`}</div>
                                    <p className="m-0">{c('Spotlight')
                                        .t`Easily find the event you're looking for with our new search feature.`}</p>
                                    <Href href={getKnowledgeBaseUrl('/calendar-search')}>{c('Link')
                                        .t`Learn more`}</Href>
                                </>
                            }
                        >
                            <Input
                                ref={inputRef}
                                inputClassName="cursor-text"
                                value={keyword}
                                placeholder={
                                    isSearchActive ? c('Placeholder').t`Search events` : c('Placeholder').t`Indexing...`
                                }
                                onChange={handleChange}
                                onKeyDown={(event) => {
                                    if (event.key === 'Enter') {
                                        handleSearch();
                                        event.preventDefault();
                                    }
                                }}
                                onSubmit={handleSearch}
                                onFocus={handleFocus}
                                data-testid="search-keyword"
                                autoFocus
                                disabled={!isSearchActive}
                                prefix={
                                    loading ? (
                                        <Icon name="arrow-rotate-right" className="location-refresh-rotate" />
                                    ) : (
                                        <Icon name="magnifier" alt={c('Action').t`Search`} />
                                    )
                                }
                                suffix={
                                    keyword.length ? (
                                        <Button
                                            type="button"
                                            shape="ghost"
                                            color="weak"
                                            size="small"
                                            className="rounded-sm"
                                            disabled={loading}
                                            title={c('Action').t`Clear search`}
                                            onClick={handleClear}
                                            data-testid="clear-button"
                                        >
                                            {c('Action').t`Clear`}
                                        </Button>
                                    ) : null
                                }
                            />
                        </Spotlight>
                    </div>
                </div>
                <Button
                    type="submit"
                    shape="solid"
                    color="norm"
                    onClick={handleSearch}
                    disabled={!isSearchActive || loading}
                    className="no-mobile"
                >{c('Action').t`Search`}</Button>
            </div>
        </>
    );
};

export default forwardRef(CalendarSearchInput);
