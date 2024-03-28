import { useRef } from 'react';

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
import { FeatureCode } from '@proton/features';
import { PLANS } from '@proton/shared/lib/constants';
import spotlightImg from '@proton/styles/assets/img/illustrations/spotlight-stars.svg';

interface Props {
    children: React.ReactNode;
}

const BreachAlertsSpotlight = ({ children }: Props) => {
    const anchorRef = useRef<HTMLDivElement>(null);
    const [subscription] = useSubscription();
    const [user] = useUser();
    const [organization] = useOrganization();
    const { viewportWidth } = useActiveBreakpoint();
    const [{ isDone }] = useWelcomeFlags();
    const isPlanAllowed =
        user.isFree ||
        [PLANS.MAIL, PLANS.BUNDLE, PLANS.FAMILY, PLANS.NEW_VISIONARY].some((plan) =>
            subscription?.Plans?.some(({ Name }) => Name === plan)
        );
    const hasCustomDomains = organization && organization?.UsedDomains > 0;

    /**
     * Display conditions:
     * 1. User is not on a mobile screen
     * 2. User has done the welcome flow
     * 3. User has a plan that can utilize breach alerts: free, mail2022, bundle2022, family2022, visionary2022
     * 4. User does not have a custom domain
     */
    const displaySpotlight = !viewportWidth['<=small'] && isDone && isPlanAllowed && !hasCustomDomains;

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
                        <p className="m-0 text-semibold">{c('Spotlight').t`Breach Alerts`}</p>
                        <p className="m-0">{c('Spotlight')
                            .t`Turn on breach alerts to monitor potential data leaks. View details and take action to protect yourself.`}</p>
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
