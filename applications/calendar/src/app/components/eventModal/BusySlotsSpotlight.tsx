import { useRef } from 'react';

import { addDays, fromUnixTime } from 'date-fns';
import { c } from 'ttag';

import { Href } from '@proton/atoms/Href';
import { Spotlight, useSpotlightShow } from '@proton/components/components';
import useBusyTimeSlotsAvailable from '@proton/components/containers/calendar/hooks/useBusyTimeSlotsAvailable';
import { useActiveBreakpoint, useSpotlightOnFeature, useUser, useWelcomeFlags } from '@proton/components/hooks';
import { FeatureCode } from '@proton/features';
import { VIEWS } from '@proton/shared/lib/calendar/constants';
import { getKnowledgeBaseUrl } from '@proton/shared/lib/helpers/url';
import spotlightImg from '@proton/styles/assets/img/illustrations/spotlight-stars.svg';

interface Props {
    children: React.ReactNode;
    view: VIEWS;
}

const BusySlotsSpotlight = ({ children, view }: Props) => {
    const anchorRef = useRef<HTMLDivElement>(null);
    const [user] = useUser();
    const { viewportWidth } = useActiveBreakpoint();
    const [{ isDone }] = useWelcomeFlags();
    const userAccountHasMoreThanTwoDays = new Date() > addDays(fromUnixTime(user.CreateTime), 2);
    const isBusyTimeSlotsAvailable = useBusyTimeSlotsAvailable(view);

    /**
     * Display conditions:
     * 1. User is not on a mobile screen
     * 2. User has done the welcome flow
     * 3. User has created his account more than 2 days ago
     * 4. Feature available for sure
     */
    const displaySpotlight =
        !viewportWidth['<=small'] && isDone && userAccountHasMoreThanTwoDays && isBusyTimeSlotsAvailable;

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
