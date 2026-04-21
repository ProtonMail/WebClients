import { useCallback, useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';

import { fromUnixTime } from 'date-fns';

import { useSubscription } from '@proton/account/subscription/hooks';
import { useUser } from '@proton/account/user/hooks';
import { useUserSettings } from '@proton/account/userSettings/hooks';
import useConfig from '@proton/components/hooks/useConfig';
import useSpotlightOnFeature from '@proton/components/hooks/useSpotlightOnFeature';
import { FeatureCode } from '@proton/features/interface';
import useFeature from '@proton/features/useFeature';
import { isPaidSubscription } from '@proton/payments/core/type-guards';
import { getAppFromPathnameSafe } from '@proton/shared/lib/apps/slugHelper';
import { addDays } from '@proton/shared/lib/date-fns-utc';
import { hasBit } from '@proton/shared/lib/helpers/bitset';
import { NEWSLETTER_SUBSCRIPTIONS_BITS } from '@proton/shared/lib/helpers/newsletter';
import { useFlag } from '@proton/unleash/useFlag';

import { getIsReferralUserEligible } from './useReferralUserEligible';

export const useReferralDiscover = () => {
    const location = useLocation();
    const [userSettings] = useUserSettings();
    const [subscription] = useSubscription();
    const [user] = useUser();
    const { isFree } = user;
    const { APP_NAME } = useConfig();

    const app = getAppFromPathnameSafe(location.pathname);
    const isUserEligible = getIsReferralUserEligible(userSettings, isFree, app, APP_NAME);

    const hasNotificationsEnabled = hasBit(userSettings.News, NEWSLETTER_SUBSCRIPTIONS_BITS.IN_APP_NOTIFICATIONS);

    const settingsSpotlightFeature = useFeature(FeatureCode.ReferralSpotlightSettings);
    const topButtonFeature = useFeature(FeatureCode.ReferralTopBarButton);
    const drawerFeature = useFeature(FeatureCode.ReferralDrawerApp);

    const isFeatureActive = useFlag('ReferralExpansionDiscover');
    const isFreeUsersDiscoverFeatureActive = useFlag('ReferralFreeUsersDiscover');

    const subscriptionStartedThirtyDaysAgo =
        isPaidSubscription(subscription) && new Date() > addDays(fromUnixTime(subscription.PeriodStart), 30);

    const userIsFreeAndCreatedThirtyDaysAgo =
        isFree && !!user.CreateTime && new Date() > addDays(fromUnixTime(user.CreateTime), 30);

    const { update: updateReferralSpotlightSettings } = settingsSpotlightFeature;
    const { update: updateReferralTopBarButton } = topButtonFeature;
    const { update: updateDrawerFeature } = drawerFeature;

    const { show: shouldShowSettingsSpotlight, onClose: onCloseSettingsSpotlight } = useSpotlightOnFeature(
        FeatureCode.ReferralSpotlightSettings,
        isFeatureActive &&
            isUserEligible &&
            hasNotificationsEnabled &&
            (subscriptionStartedThirtyDaysAgo ||
                (isFreeUsersDiscoverFeatureActive && userIsFreeAndCreatedThirtyDaysAgo))
    );

    const onceRef = useRef(false);

    const handleCloseSettingsSpotlight = useCallback(async () => {
        onCloseSettingsSpotlight();
        if (!onceRef.current) {
            onceRef.current = true;
            void updateReferralSpotlightSettings(false);
        }
    }, [onCloseSettingsSpotlight]);

    // Remove spotlight if user has seen referral page
    useEffect(() => {
        if (isFeatureActive && location?.pathname.includes('/referral')) {
            void handleCloseSettingsSpotlight();
        }
    }, [location?.pathname, isFeatureActive]);

    const canShowTopBarButton =
        isFeatureActive &&
        isUserEligible &&
        hasNotificationsEnabled &&
        (subscriptionStartedThirtyDaysAgo || (isFreeUsersDiscoverFeatureActive && userIsFreeAndCreatedThirtyDaysAgo)) &&
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
