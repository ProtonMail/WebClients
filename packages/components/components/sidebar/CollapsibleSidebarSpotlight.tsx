import { useRef } from 'react';

import { addDays, fromUnixTime } from 'date-fns';
import { c } from 'ttag';

import { Spotlight, useSpotlightShow } from '@proton/components/components';
import { useActiveBreakpoint, useSpotlightOnFeature, useUser, useWelcomeFlags } from '@proton/components/hooks';
import { FeatureCode } from '@proton/features/interface';
import { APPS, type APP_NAMES } from '@proton/shared/lib/constants';
import spotlightImg from '@proton/styles/assets/img/illustrations/spotlight-stars.svg';

interface Props {
    children: React.ReactNode;
    app: APP_NAMES;
    isAskUpdateTimezoneModalOpen?: boolean;
}

const CollapsibleSidebarSpotlight = ({ children, app, isAskUpdateTimezoneModalOpen }: Props) => {
    const anchorRef = useRef<HTMLDivElement>(null);
    const [user] = useUser();
    const { viewportWidth } = useActiveBreakpoint();
    const [{ isDone }] = useWelcomeFlags();
    const userAccountHasMoreThanTwoDays = new Date() > addDays(fromUnixTime(user.CreateTime), 2);
    const feature =
        app === APPS.PROTONCALENDAR
            ? FeatureCode.CollapsibleSidebarSpotlightCalendar
            : FeatureCode.CollapsibleSidebarSpotlightMail;

    const tzmodalNotOpened = app === APPS.PROTONCALENDAR ? !isAskUpdateTimezoneModalOpen : true;

    /**
     * Display conditions:
     * 1. User is not on a mobile screen
     * 2. User has done the welcome flow
     * 3. User has created his account more than 2 days ago
     * 4. Feature available for sure (spotlight is included in sidebar in a FF if, so covered)
     * Bonus: no timezone modal opened for Calendar
     */

    const displaySpotlight = !viewportWidth['<=small'] && isDone && userAccountHasMoreThanTwoDays && tzmodalNotOpened;

    const { show, onDisplayed, onClose } = useSpotlightOnFeature(feature, displaySpotlight);

    const shouldShowSpotlight = useSpotlightShow(show);

    return (
        <Spotlight
            originalPlacement="left"
            show={shouldShowSpotlight}
            onDisplayed={onDisplayed}
            anchorRef={anchorRef}
            onClose={onClose}
            size="large"
            content={
                <div className="flex flex-nowrap items-center my-2">
                    <div className="shrink-0 mr-4">
                        <img src={spotlightImg} alt="" />
                    </div>
                    <div>
                        <p className="m-0">{c('Spotlight').t`You can now collapse the navigation bar.`}</p>
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

export default CollapsibleSidebarSpotlight;
