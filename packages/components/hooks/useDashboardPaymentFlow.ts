import { useMemo } from 'react';

import type { APP_NAMES } from '@proton/shared/lib/constants';
import { APPS } from '@proton/shared/lib/constants';

import type { TelemetryPaymentFlow } from '../payments/client-extensions/usePaymentsTelemetry';
import useShowDashboard, { getDashboardFeatureFlag } from './accounts/useShowDashboard';
import useShowVPNDashboard from './useShowVPNDashboard';

const getPrefix = (appName: APP_NAMES): 'mail-' | 'calendar-' | undefined => {
    switch (appName) {
        case APPS.PROTONMAIL:
            return 'mail-';
        case APPS.PROTONCALENDAR:
            return 'calendar-';
    }
};

const useDashboardPaymentFlow = (app: APP_NAMES): TelemetryPaymentFlow => {
    const { showVPNDashboard, showVPNDashboardVariant, canShowVPNDashboard } = useShowVPNDashboard(app);
    const { showDashboard, canShowDashboard, variant } = useShowDashboard(app, getDashboardFeatureFlag(app));

    const variantName = app === APPS.PROTONVPN_SETTINGS ? showVPNDashboardVariant.name : variant.name;
    const canDashboardBeVisible = app === APPS.PROTONVPN_SETTINGS ? canShowVPNDashboard : canShowDashboard;
    const prefix = getPrefix(app);

    return useMemo((): TelemetryPaymentFlow => {
        if (!canDashboardBeVisible) {
            return 'subscription';
        }
        switch (true) {
            case variantName === 'Control':
                return 'dashboard-upgrade-control';
            case app === APPS.PROTONVPN_SETTINGS && variantName === 'A':
                return 'dashboard-upgrade-A';
            case app === APPS.PROTONVPN_SETTINGS && variantName === 'B':
                return 'dashboard-upgrade-B';
            case prefix && variantName === 'A':
                return `${prefix}dashboard-variant-A`;
            case prefix && variantName === 'B':
                return `${prefix}dashboard-variant-B`;
            default:
                return 'subscription';
        }
    }, [showVPNDashboard, showDashboard, canDashboardBeVisible, variantName]);
};

export default useDashboardPaymentFlow;
