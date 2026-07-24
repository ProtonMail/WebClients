import { useMemo } from 'react';

import { useOrganization } from '@proton/account/organization/hooks';
import { useSubscription } from '@proton/account/subscription/hooks';
import { getIsB2BAudienceFromSubscription } from '@proton/payments/core/subscription/helpers';
import type { APP_NAMES } from '@proton/shared/lib/constants';
import { APPS } from '@proton/shared/lib/constants';
import { isOrganizationB2B } from '@proton/shared/lib/organization/helper';
import { useFlag } from '@proton/unleash/useFlag';
import { useVariant } from '@proton/unleash/useVariant';

const useIsDashboardB2BAudience = () => {
    const [organization] = useOrganization();
    const [subscription] = useSubscription();
    return getIsB2BAudienceFromSubscription(subscription) || isOrganizationB2B(organization);
};

/**
 * The Mail/Calendar, Pass and Meet dashboards are fully rolled out: they are shown to every
 * non-B2B user of the matching app, without a feature flag. See `useShowDriveDashboard` for
 * the Drive dashboard, which is still flag-gated.
 */
const useShowDashboard = (appName: APP_NAMES) => {
    const isB2B = useIsDashboardB2BAudience();

    const showDashboard = useMemo(() => {
        if (isB2B) {
            return false;
        }
        switch (appName) {
            case APPS.PROTONMAIL:
            case APPS.PROTONCALENDAR:
            case APPS.PROTONPASS:
            case APPS.PROTONMEET:
                return true;
            default:
                return false;
        }
    }, [appName, isB2B]);

    return { showDashboard };
};

/**
 * The Drive dashboard is still gated behind the `DriveDashboard` feature flag + A/B variant.
 */
export const useShowDriveDashboard = (appName: APP_NAMES) => {
    const isDriveDashboardEnabled = useFlag('DriveDashboard');
    const variant = useVariant('DriveDashboard');
    const isB2B = useIsDashboardB2BAudience();

    const canShowDashboard = useMemo(
        () => appName === APPS.PROTONDRIVE && !isB2B && isDriveDashboardEnabled,
        [appName, isB2B, isDriveDashboardEnabled]
    );

    const showDashboard = useMemo(
        // 'A' variant is the current (old) dashboard and 'B' (and other variants) are for the new dashboard
        () => canShowDashboard && variant.name !== 'A',
        [canShowDashboard, variant]
    );

    return { showDashboard, variant, canShowDashboard };
};

export const useShowGenericDashboard = (appName: APP_NAMES) => {
    const isB2B = useIsDashboardB2BAudience();
    return appName === APPS.PROTONACCOUNT && !isB2B;
};

export default useShowDashboard;
