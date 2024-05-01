import { useRef } from 'react';

import { differenceInDays, differenceInMilliseconds, fromUnixTime } from 'date-fns';
import { c } from 'ttag';

import { Spotlight, useSpotlightShow } from '@proton/components/components';
import {
    useActiveBreakpoint,
    useOrganization,
    useSpotlightOnFeature,
    useSubscription,
    useUser,
    useWelcomeFlags,
} from '@proton/components/hooks';
import { FeatureCode, useFeature } from '@proton/features';
import { FeatureContextValue } from '@proton/features/useFeatures';
import { DARK_WEB_MONITORING_NAME, MINUTE, PLANS } from '@proton/shared/lib/constants';
import spotlightImg from '@proton/styles/assets/img/illustrations/sentinel-shield-bolt-breach-alert.svg';

interface Props {
    children: React.ReactNode;
}

const TIME_THRESHOLD = 1 * MINUTE;
const hasFeatureBeenDisplayedOrRemoved = (overlappingFeature: FeatureContextValue<any>, currentTime: number) => {
    const currentTimeInSeconds = Math.floor(currentTime / 1000);

    if (!overlappingFeature) {
        return true;
    }
    const { feature } = overlappingFeature;

    if (feature) {
        if (
            Object.keys(feature).length === 0 ||
            (feature.Value === false &&
                differenceInMilliseconds(fromUnixTime(currentTimeInSeconds), fromUnixTime(feature.UpdateTime)) >=
                    TIME_THRESHOLD)
        ) {
            return true;
        }
    }
    return false;
};

const BreachAlertsSpotlight = ({ children }: Props) => {
    const anchorRef = useRef<HTMLDivElement>(null);
    const [subscription] = useSubscription();
    const [user] = useUser();
    const [organization] = useOrganization();
    const { viewportWidth } = useActiveBreakpoint();
    const [{ isDone }] = useWelcomeFlags();
    const inboxDesktopFeature = useFeature(FeatureCode.SpotlightInboxDesktop);

    /**
     * Display conditions:
     * 1. User is not on a mobile screen
     * 2. User has done the welcome flow
     * 3. User has a plan that can utilize breach alerts: free, mail2022, bundle2022, family2022, visionary2022
     * 4. User does not have a custom domain
     * 5. Any overlapping Feature Spotlights have already been shown for active users and have been shown at least a minute before for inative users
     * 6. Account is older than 4 days
     */

    const isPlanAllowed =
        user.isFree ||
        [PLANS.MAIL, PLANS.BUNDLE, PLANS.FAMILY, PLANS.NEW_VISIONARY].some((plan) =>
            subscription?.Plans?.some(({ Name }) => Name === plan)
        );
    const hasCustomDomains = organization && organization?.UsedDomains > 0;
    const accountIsOlderThanFourDays = differenceInDays(new Date(), fromUnixTime(user.CreateTime)) >= 4;

    // we want to prevent breach alerts spotlight from overlapping with the sec center and desktop spotlights
    const currentTime = Date.now();
    const noOverlapping = hasFeatureBeenDisplayedOrRemoved(inboxDesktopFeature, currentTime);

    const displaySpotlight =
        !viewportWidth['<=small'] &&
        isDone &&
        isPlanAllowed &&
        !hasCustomDomains &&
        noOverlapping &&
        accountIsOlderThanFourDays;

    const { show, onDisplayed, onClose } = useSpotlightOnFeature(
        FeatureCode.SpotlightBreachAlertSecurityCenter,
        displaySpotlight
    );

    const shouldShowSpotlight = useSpotlightShow(show);

    return (
        <Spotlight
            originalPlacement="left"
            show={shouldShowSpotlight}
            onDisplayed={onDisplayed}
            anchorRef={anchorRef}
            size="large"
            content={
                <div className="flex flex-nowrap my-2">
                    <div className="shrink-0 mr-4">
                        <img src={spotlightImg} alt="" />
                    </div>
                    <div>
                        <p className="m-0 text-semibold">{DARK_WEB_MONITORING_NAME}</p>
                        <p className="m-0">{c('Spotlight')
                            .t`Turn on ${DARK_WEB_MONITORING_NAME} to get notified if your data was leaked from a third-party service.`}</p>
                    </div>
                </div>
            }
        >
            <div ref={anchorRef} onClick={onClose}>
                {children}
            </div>
        </Spotlight>
    );
};

export default BreachAlertsSpotlight;
