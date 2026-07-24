import { useMemo } from 'react';

import type { APP_NAMES } from '@proton/shared/lib/constants';
import { APPS } from '@proton/shared/lib/constants';

import type { TelemetryPaymentFlow } from '../payments/client-extensions/usePaymentsTelemetry';
import useShowDashboard, { useShowDriveDashboard } from './accounts/useShowDashboard';
import useShowVPNDashboard from './useShowVPNDashboard';

const useDashboardPaymentFlow = (app: APP_NAMES): TelemetryPaymentFlow => {
    const { showVPNDashboardVariant, canShowVPNDashboard } = useShowVPNDashboard(app);
    const { canShowDashboard: canShowDriveDashboard, variant } = useShowDriveDashboard(app);
    const { showDashboard } = useShowDashboard(app);

    return useMemo((): TelemetryPaymentFlow => {
        switch (app) {
            case APPS.PROTONVPN_SETTINGS:
                if (!canShowVPNDashboard) {
                    return 'subscription';
                }
                switch (showVPNDashboardVariant.name) {
                    case 'Control':
                        return 'dashboard-upgrade-control';
                    case 'A':
                        return 'dashboard-upgrade-A';
                    case 'B':
                        return 'dashboard-upgrade-B';
                    default:
                        return 'subscription';
                }
            case APPS.PROTONDRIVE:
                if (!canShowDriveDashboard) {
                    return 'subscription';
                }
                switch (variant.name) {
                    case 'A':
                        return 'drive-dashboard-variant-A';
                    case 'B':
                        return 'drive-dashboard-variant-B';
                    default:
                        return 'subscription';
                }
            // Mail/Calendar/Pass dashboards are fully rolled out to the new dashboard
            case APPS.PROTONMAIL:
                return showDashboard ? 'mail-dashboard-variant-B' : 'subscription';
            case APPS.PROTONCALENDAR:
                return showDashboard ? 'calendar-dashboard-variant-B' : 'subscription';
            case APPS.PROTONPASS:
                return showDashboard ? 'pass-dashboard-variant-B' : 'subscription';
            default:
                return 'subscription';
        }
    }, [app, canShowVPNDashboard, showVPNDashboardVariant.name, canShowDriveDashboard, variant.name, showDashboard]);
};

export default useDashboardPaymentFlow;
