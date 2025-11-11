import { useMemo } from 'react';

import { useOrganization } from '@proton/account/organization/hooks';
import { useSubscription } from '@proton/account/subscription/hooks';
import { getIsB2BAudienceFromSubscription } from '@proton/payments';
import type { APP_NAMES } from '@proton/shared/lib/constants';
import { APPS } from '@proton/shared/lib/constants';
import { languageCode } from '@proton/shared/lib/i18n';
import { isOrganizationB2B } from '@proton/shared/lib/organization/helper';
import { type FeatureFlagVariant, type FeatureFlagsWithVariant, useFlag, useVariant } from '@proton/unleash';

export const getDashboardFeatureFlag = (appName: APP_NAMES): FeatureFlagsWithVariant => {
    switch (appName) {
        case APPS.PROTONMAIL:
        case APPS.PROTONCALENDAR:
            return 'MailDashboard';
        case APPS.PROTONPASS:
            return 'PassDashboard';
        case APPS.PROTONVPN_SETTINGS:
            return 'VPNDashboard';
        default:
            return 'VPNDashboard';
    }
};

const DASHBOARD_NAMES = {
    MAIL: 'MailDashboard',
    VPN: 'VPNDashboard',
    PASS: 'PassDashboard',
} as const;

const shouldDisplayDashboard = (appName: APP_NAMES, dashboardName: FeatureFlagsWithVariant) => {
    switch (appName) {
        case APPS.PROTONMAIL:
        case APPS.PROTONCALENDAR:
            return dashboardName === DASHBOARD_NAMES.MAIL && languageCode === 'en';
        case APPS.PROTONVPN_SETTINGS:
            return dashboardName === DASHBOARD_NAMES.VPN;
        case APPS.PROTONPASS:
            return dashboardName === DASHBOARD_NAMES.PASS;
        default:
            return false;
    }
};

const useShowDashboard = <FlagName extends FeatureFlagsWithVariant>(appName: APP_NAMES, dashboardName: FlagName) => {
    const [organization] = useOrganization();
    const [subscription] = useSubscription();
    const isDashboardEnabled = useFlag(dashboardName);
    const variant: FeatureFlagVariant<FlagName> = useVariant(dashboardName);

    const isB2B = getIsB2BAudienceFromSubscription(subscription) || isOrganizationB2B(organization);

    const canShowDashboard = useMemo(() => {
        return shouldDisplayDashboard(appName, dashboardName) && !isB2B && isDashboardEnabled;
    }, [appName, isB2B, dashboardName, isDashboardEnabled]);

    const showDashboard = useMemo(() => {
        // 'A' variant is set for current dashboard and 'B' (and other variants) are for later dashboards
        return canShowDashboard && variant.name !== 'A';
    }, [canShowDashboard, variant]);

    return { showDashboard, variant, canShowDashboard };
};

export default useShowDashboard;
