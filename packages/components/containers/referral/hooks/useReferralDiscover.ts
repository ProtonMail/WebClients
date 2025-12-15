import { useCallback, useEffect } from 'react';
import type { useLocation } from 'react-router-dom';

import { fromUnixTime } from 'date-fns';

import { useSubscription } from '@proton/account/subscription/hooks';
import { useUserSettings } from '@proton/account/userSettings/hooks';
import useSpotlightOnFeature from '@proton/components/hooks/useSpotlightOnFeature';
import { FeatureCode } from '@proton/features/interface';
import useFeature from '@proton/features/useFeature';
import { addDays } from '@proton/shared/lib/date-fns-utc';
import { hasBit } from '@proton/shared/lib/helpers/bitset';
import { NEWSLETTER_SUBSCRIPTIONS_BITS } from '@proton/shared/lib/helpers/newsletter';
import { useFlag } from '@proton/unleash';

export const useReferralDiscover = (location?: ReturnType<typeof useLocation>) => {
    const [userSettings] = useUserSettings();
    const [subscription] = useSubscription();

    const hasNotificationsEnabled = hasBit(userSettings.News, NEWSLETTER_SUBSCRIPTIONS_BITS.IN_APP_NOTIFICATIONS);

    const settingsSpotlightFeature = useFeature(FeatureCode.ReferralSpotlightSettings);
    const topButtonFeature = useFeature(FeatureCode.ReferralTopBarButton);
    const drawerFeature = useFeature(FeatureCode.ReferralDrawerApp);

    const isFeatureActive = useFlag('ReferralExpansionDiscover');
    const isUserEligible = !!userSettings?.Referral?.Eligible;

    const subscriptionStartedThirtyDaysAgo =
        !!subscription?.PeriodStart && new Date() > addDays(fromUnixTime(subscription.PeriodStart), 30);

    const { update: updateReferralSpotlightSettings } = settingsSpotlightFeature;
    const { update: updateReferralTopBarButton } = topButtonFeature;
    const { update: updateDrawerFeature } = drawerFeature;

    const { show: shouldShowSettingsSpotlight, onClose: onCloseSettingsSpotlight } = useSpotlightOnFeature(
        FeatureCode.ReferralSpotlightSettings,
        isFeatureActive && isUserEligible && hasNotificationsEnabled && subscriptionStartedThirtyDaysAgo
    );

    const handleCloseSettingsSpotlight = useCallback(() => {
        onCloseSettingsSpotlight();
        void updateReferralSpotlightSettings(false);
    }, [onCloseSettingsSpotlight]);

    // Remove spotlight if user has seen referral page
    useEffect(() => {
        if (isFeatureActive && location?.pathname.includes('/referral')) {
            handleCloseSettingsSpotlight();
        }
    }, [location?.pathname, isFeatureActive]);

    const canShowTopBarButton =
        isFeatureActive &&
        isUserEligible &&
        hasNotificationsEnabled &&
        subscriptionStartedThirtyDaysAgo &&
        !!topButtonFeature.feature?.Value;

    const canShowDrawerApp = isFeatureActive && isUserEligible && !!drawerFeature.feature?.Value;

    const onTopBarSpotlightDismiss = () => {
        void updateReferralTopBarButton(false);
    };

    const onDrawerAppDismiss = () => {
        void updateDrawerFeature(false);
    };

    return {
        // Settings spotlight
        shouldShowSettingsSpotlight,
        onCloseSettingsSpotlight: handleCloseSettingsSpotlight,

        // Top bar button and spotlight
        canShowTopBarButton,
        onTopBarSpotlightDismiss,

        // Drawer app
        canShowDrawerApp,
        onDrawerAppDismiss,
    };
};
