import { MouseEvent, Ref, forwardRef, useRef } from 'react';

import { isBefore, sub } from 'date-fns';
import { c } from 'ttag';

import { Button, Href, Input } from '@proton/atoms';
import { Icon } from '@proton/components/components/icon';
import { Spotlight, useSpotlightShow } from '@proton/components/components/spotlight';
import { FeatureCode } from '@proton/components/containers/features';
import { useActiveBreakpoint, useSpotlightOnFeature, useUser, useWelcomeFlags } from '@proton/components/hooks';
import { SECOND } from '@proton/shared/lib/constants';
import { getKnowledgeBaseUrl } from '@proton/shared/lib/helpers/url';

interface Props {
    onOpen: () => void;
    value: string;
    loading: boolean;
    onChange: (newValue: string) => void;
    onClear: () => void;
}

const CalendarSearchInput = ({ value, loading, onOpen, onClear }: Props, ref: Ref<HTMLInputElement>) => {
    const [user] = useUser();
    const [{ isWelcomeFlow }] = useWelcomeFlags();
    const { isNarrow } = useActiveBreakpoint();

    const inputRef = useRef<HTMLInputElement>(null);
    const spotlightAnchorRef = useRef<HTMLButtonElement>(null);
    const {
        show: showHolidaysSpotlight,
        onDisplayed: onSpotlightDisplayed,
        onClose: onCloseSpotlight,
    } = useSpotlightOnFeature(
        FeatureCode.CalendarSearchSpotlight,
        isBefore(new Date(user.CreateTime * SECOND), sub(new Date(), { weeks: 1 })) && !isNarrow && !isWelcomeFlow,
        // TODO: update
        {
            alpha: Date.UTC(2022, 4, 25, 12),
            beta: Date.UTC(2022, 4, 25, 12),
            default: Date.UTC(2022, 4, 25, 12),
        }
    );

    const shouldShowHolidaysSpotlight = useSpotlightShow(showHolidaysSpotlight);

    const handleClear = (event: MouseEvent<HTMLButtonElement>) => {
        event.stopPropagation();
        onClear();
    };

    const handleFocus = () => {
        // close spotlight if it's on display
        if (shouldShowHolidaysSpotlight) {
            onCloseSpotlight();
        }

        // Blur the input to avoid the focus to be triggered after search submission
        inputRef.current?.blur();
        onOpen();
    };

    return (
        <div className="searchbox flex" role="search">
            <div ref={ref} className="w100 m-auto">
                <Spotlight
                    originalPlacement="bottom-start"
                    show={shouldShowHolidaysSpotlight}
                    onDisplayed={onSpotlightDisplayed}
                    type="new"
                    anchorRef={spotlightAnchorRef}
                    content={
                        <>
                            <div className="text-lg text-bold mb-1">{c('Spotlight').t`Search for events`}</div>
                            <p className="m-0">{c('Spotlight')
                                .t`Easily find the event you’re looking for with our new search feature.`}</p>
                            <Href href={getKnowledgeBaseUrl('/calendar-search')}>{c('Link').t`Learn more`}</Href>
                        </>
                    }
                >
                    <Input
                        ref={inputRef}
                        inputClassName="cursor-text"
                        value={value}
                        placeholder={c('Placeholder').t`Search events`}
                        onFocus={() => handleFocus()}
                        data-testid="search-keyword"
                        readOnly
                        prefix={
                            loading ? (
                                <Icon name="arrow-rotate-right" className="location-refresh-rotate" />
                            ) : (
                                <Button
                                    type="submit"
                                    icon
                                    shape="ghost"
                                    color="weak"
                                    size="small"
                                    className="rounded-sm no-pointer-events"
                                    title={c('Action').t`Search`}
                                    onClick={() => onOpen()}
                                    data-shorcut-target="searchbox-button"
                                    ref={spotlightAnchorRef}
                                >
                                    <Icon name="magnifier" alt={c('Action').t`Search`} />
                                </Button>
                            )
                        }
                        suffix={
                            value.length ? (
                                <Button
                                    type="button"
                                    shape="ghost"
                                    color="weak"
                                    size="small"
                                    className="rounded-sm"
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
    );
};

export default forwardRef(CalendarSearchInput);
