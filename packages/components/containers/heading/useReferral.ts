import { useEffect, useState } from 'react';
import type { useLocation } from 'react-router-dom';

import { fromUnixTime } from 'date-fns';

import { useUserSettings } from '@proton/account/userSettings/hooks';
import useSpotlightShow from '@proton/components/components/spotlight/useSpotlightShow';
import { subscription } from '@proton/components/containers/payments/subscription/__mocks__/data';
import useConfig from '@proton/components/hooks/useConfig';
import useSpotlightOnFeature from '@proton/components/hooks/useSpotlightOnFeature';
import { FeatureCode } from '@proton/features/interface';
import useFeature from '@proton/features/useFeature';
import { APPS } from '@proton/shared/lib/constants';
import { addDays } from '@proton/shared/lib/date-fns-utc';

export const useReferral = (location: ReturnType<typeof useLocation>) => {
    const { APP_NAME } = useConfig();
    const [userSettings] = useUserSettings();
    const [redDotReferral, setRedDotReferral] = useState(false);

    const { feature: referralProgramFeature } = useFeature(FeatureCode.ReferralProgram);

    const subscriptionStartedThirtyDaysAgo =
        !!subscription?.PeriodStart && new Date() > addDays(fromUnixTime(subscription.PeriodStart), 30);
    const {
        show: showSpotlight,
        onDisplayed: onDisplayedSpotlight,
        onClose: onCloseSpotlight,
    } = useSpotlightOnFeature(
        FeatureCode.ReferralProgramSpotlight,
        !!referralProgramFeature?.Value && !!userSettings?.Referral?.Eligible && subscriptionStartedThirtyDaysAgo
    );
    const shouldShowSpotlight = useSpotlightShow(showSpotlight, 3000);

    // Show referral dot if the spotlight has been displayed
    useEffect(() => {
        if (shouldShowSpotlight) {
            setRedDotReferral(true);
        }
    }, [shouldShowSpotlight, location.pathname]);

    // Hide red dot referral if user has already seen referral page
    useEffect(() => {
        if (location.pathname.includes('/referral')) {
            setRedDotReferral(false);
        }
    }, [location.pathname]);

    const visible =
        APP_NAME !== APPS.PROTONVPN_SETTINGS && referralProgramFeature?.Value && userSettings?.Referral?.Eligible;

    return {
        shouldShowSpotlight,
        redDotReferral,
        onDisplayedSpotlight,
        onCloseSpotlight,
        visible,
    };
};
