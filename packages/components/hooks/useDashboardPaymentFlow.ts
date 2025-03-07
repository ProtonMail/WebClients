import { useMemo } from 'react';

import type { PaymentMethodFlows } from '@proton/payments/index';
import type { APP_NAMES } from '@proton/shared/lib/constants';

import useShowVPNDashboard from './useShowVPNDashboard';

const useDashboardPaymentFlow = (app: APP_NAMES): PaymentMethodFlows => {
    const { showVPNDashboard, showVPNDashboardVariant } = useShowVPNDashboard(app);

    return useMemo(() => {
        if (!showVPNDashboard) {
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
    }, [showVPNDashboard, showVPNDashboardVariant]);
};

export default useDashboardPaymentFlow;
