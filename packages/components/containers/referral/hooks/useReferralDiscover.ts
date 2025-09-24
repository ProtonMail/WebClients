import { useEffect } from 'react';
import type { useLocation } from 'react-router-dom';

import { fromUnixTime } from 'date-fns';

import { useSubscription } from '@proton/account/subscription/hooks';
import { useUserSettings } from '@proton/account/userSettings/hooks';
import useSpotlightOnFeature from '@proton/components/hooks/useSpotlightOnFeature';
import { FeatureCode } from '@proton/features/interface';
import useFeature from '@proton/features/useFeature';
import { addDays } from '@proton/shared/lib/date-fns-utc';
import { useFlag } from '@proton/unleash';

export const useReferralDiscover = (location?: ReturnType<typeof useLocation>) => {
    const [userSettings] = useUserSettings();
    const [subscription] = useSubscription();

    const settingsSpotlightFeature = useFeature(FeatureCode.ReferralSpotlightSettings);
    const topButtonFeature = useFeature(FeatureCode.ReferralTopBarButton);

    const isFeatureActive = useFlag('ReferralExpansion');
    const isUserEligible = !!userSettings?.Referral?.Eligible;

    const subscriptionStartedThirtyDaysAgo =
        !!subscription?.PeriodStart && new Date() > addDays(fromUnixTime(subscription.PeriodStart), 30);

    const { update: updateReferralSpotlightSettings } = settingsSpotlightFeature;
    const { update: updateReferralTopBarButton } = topButtonFeature;

    const { show: shouldShowSettingsSpotlight, onClose: onCloseSettingsSpotlight } = useSpotlightOnFeature(
        FeatureCode.ReferralSpotlightSettings,
        isFeatureActive && isUserEligible && subscriptionStartedThirtyDaysAgo
    );

    // Remove spotlight if user has seen referral page
    useEffect(() => {
        if (location?.pathname.includes('/referral')) {
            onCloseSettingsSpotlight();
            void updateReferralSpotlightSettings(false);
        }
    }, [location?.pathname]);

    const canShowTopBarButton =
        isFeatureActive && isUserEligible && subscriptionStartedThirtyDaysAgo && !!topButtonFeature.feature?.Value;
    const canShowDrawerApp = isFeatureActive && isUserEligible && subscriptionStartedThirtyDaysAgo;

    const onTopBarSpotlightDismiss = () => {
        void updateReferralTopBarButton(false);
    };

    return {
        // Settings spotlight
        shouldShowSettingsSpotlight,
        onCloseSettingsSpotlight,

        // Top bar button and spotlight
        canShowTopBarButton,
        canShowDrawerApp,
        onTopBarSpotlightDismiss,
    };
};
