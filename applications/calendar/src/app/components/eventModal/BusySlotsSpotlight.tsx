import { useRef } from 'react';

import { addDays, fromUnixTime } from 'date-fns';
import { c } from 'ttag';

import { Href } from '@proton/atoms';
import { Spotlight, useSpotlightShow } from '@proton/components';
import useBusySlotsAvailable from '@proton/components/containers/calendar/hooks/useBusySlotsAvailable';
import { useActiveBreakpoint, useSpotlightOnFeature, useUser, useWelcomeFlags } from '@proton/components/hooks';
import { FeatureCode } from '@proton/features';
import type { VIEWS } from '@proton/shared/lib/calendar/constants';
import { getKnowledgeBaseUrl } from '@proton/shared/lib/helpers/url';
import spotlightImg from '@proton/styles/assets/img/illustrations/spotlight-stars.svg';

interface Props {
    children: React.ReactNode;
    view: VIEWS;
    isDisplayedInPopover: boolean;
}

const BusySlotsSpotlight = ({ children, view, isDisplayedInPopover }: Props) => {
    const anchorRef = useRef<HTMLDivElement>(null);
    const [user] = useUser();
    const { viewportWidth } = useActiveBreakpoint();
    const [{ isDone }] = useWelcomeFlags();
    const userAccountHasMoreThanTwoDays = new Date() > addDays(fromUnixTime(user.CreateTime), 2);
    const isBusySlotsAvailable = useBusySlotsAvailable(view);

    /**
     * Display conditions:
     * 1. User is not on a mobile screen
     * 2. User has done the welcome flow
     * 3. User has created his account more than 2 days ago
     * 4. Feature available for sure
     * 5. Is in the popover modal
     */
    const displaySpotlight =
        !viewportWidth['<=small'] &&
        isDone &&
        userAccountHasMoreThanTwoDays &&
        isBusySlotsAvailable &&
        isDisplayedInPopover;

    const { show, onDisplayed, onClose } = useSpotlightOnFeature(
        FeatureCode.CalendarBusySlotsSpotlight,
        displaySpotlight
    );

    const shouldShowSpotlight = useSpotlightShow(show);

    return (
        <Spotlight
            originalPlacement="right"
            show={shouldShowSpotlight}
            onDisplayed={onDisplayed}
            anchorRef={anchorRef}
            onClose={onClose}
            size="large"
            isAboveModal
            content={
                <div className="flex flex-nowrap my-2">
                    <div className="shrink-0 mr-4">
                        <img src={spotlightImg} alt="" />
                    </div>
                    <div>
                        <p className="mt-0 mb-2 text-bold">{c('Spotlight').t`No more scheduling conflicts`}</p>
                        <p className="m-0">{c('Spotlight')
                            .t`Now you can see when participants are free to attend your meeting.`}</p>
                        <Href href={getKnowledgeBaseUrl('/calendar-availability')}>{c('Info').t`Learn more`}</Href>
                    </div>
                </div>
            }
        >
            {/* eslint-disable-next-line jsx-a11y/click-events-have-key-events, jsx-a11y/no-static-element-interactions */}
            <div ref={anchorRef} onClick={onClose}>
                {children}
            </div>
        </Spotlight>
    );
};

export default BusySlotsSpotlight;
