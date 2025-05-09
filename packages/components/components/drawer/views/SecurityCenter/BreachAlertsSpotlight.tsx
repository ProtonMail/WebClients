import { useRef } from 'react';

import { c } from 'ttag';

import { useWelcomeFlags } from '@proton/account';
import { useOrganization } from '@proton/account/organization/hooks';
import { useSubscription } from '@proton/account/subscription/hooks';
import { useUser } from '@proton/account/user/hooks';
import Spotlight from '@proton/components/components/spotlight/Spotlight';
import useSpotlightShow from '@proton/components/components/spotlight/useSpotlightShow';
import useSpotlightOnFeature from '@proton/components/hooks/useSpotlightOnFeature';
import { FeatureCode } from '@proton/features';
import { PLANS } from '@proton/payments';
import { DARK_WEB_MONITORING_NAME, SECOND } from '@proton/shared/lib/constants';
import { isUserAccountOlderThanOrEqualToDays } from '@proton/shared/lib/user/helpers';
import spotlightImg from '@proton/styles/assets/img/illustrations/sentinel-shield-bolt-breach-alert.svg';

interface Props {
    children: React.ReactNode;
}

const BreachAlertsSpotlight = ({ children }: Props) => {
    const anchorRef = useRef<HTMLDivElement>(null);
    const [subscription] = useSubscription();
    const [user] = useUser();
    const [organization] = useOrganization();
    const {
        welcomeFlags: { isDone },
    } = useWelcomeFlags();

    /**
     * Display conditions:
     * 1. User is not on a mobile screen
     * 2. User has done the welcome flow
     * 3. User has a plan that can utilize breach alerts: mail2022, bundle2022, family2022, visionary2022, duo2024
     * 4. User does not have a custom domain
     * 5. Account is older than 4 days
     */
    const isPlanAllowed = [PLANS.MAIL, PLANS.BUNDLE, PLANS.DUO, PLANS.FAMILY, PLANS.VISIONARY].some((plan) =>
        subscription?.Plans?.some(({ Name }) => Name === plan)
    );
    const hasCustomDomains = organization && organization?.UsedDomains > 0;
    const accountIsOlderThanFourDays = isUserAccountOlderThanOrEqualToDays(user, 4);

    const { show, onDisplayed, onClose } = useSpotlightOnFeature(
        FeatureCode.SpotlightBreachAlertSecurityCenter,
        isDone && isPlanAllowed && !hasCustomDomains && accountIsOlderThanFourDays
    );

    const shouldShowSpotlight = useSpotlightShow(show, 3 * SECOND);

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
