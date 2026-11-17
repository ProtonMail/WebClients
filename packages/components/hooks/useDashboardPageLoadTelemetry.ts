import { useEffect } from 'react';

import { useSubscription } from '@proton/account/subscription/hooks';
import { useApi } from '@proton/app-context/useApi';
import { getPlanName } from '@proton/payments/core/subscription/helpers';
import { isFreeSubscription } from '@proton/payments/core/type-guards';
import { TelemetryAccountDashboardEvents, TelemetryMeasurementGroups } from '@proton/shared/lib/api/telemetry';
import type { APP_NAMES } from '@proton/shared/lib/constants';
import { sendTelemetryReport } from '@proton/shared/lib/helpers/metrics';

import type { TelemetryUserTier } from '../helpers/getTelemetryUserTier';
import useShowDashboard, { useShowDriveDashboard } from './accounts/useShowDashboard';
import useShowVPNDashboard from './useShowVPNDashboard';

const useDashboardPageLoadTelemetry = ({ app, userTier }: { app: APP_NAMES; userTier: TelemetryUserTier }) => {
    const api = useApi();
    const [subscription] = useSubscription();
    const { showDashboard } = useShowDashboard(app);
    const { canShowDashboard: canShowDriveDashboard } = useShowDriveDashboard(app);
    const { canShowVPNDashboard } = useShowVPNDashboard(app);
    const canShowDashboard = showDashboard || canShowDriveDashboard || canShowVPNDashboard;
    const hasSubscription = !!subscription;

    const sendTelemetry = async () => {
        await sendTelemetryReport({
            api,
            measurementGroup: TelemetryMeasurementGroups.accountDashboard,
            event: TelemetryAccountDashboardEvents.pageLoad,
            dimensions: {
                app,
                user_tier: userTier,
                plan: isFreeSubscription(subscription) ? 'free' : String(getPlanName(subscription) ?? 'free'),
                billing_period: subscription?.Cycle ? String(subscription.Cycle) : 'none',
            },
            delay: false,
        });
    };

    useEffect(() => {
        if (canShowDashboard && hasSubscription) {
            void sendTelemetry();
        }
    }, [canShowDashboard, hasSubscription]);
};

export default useDashboardPageLoadTelemetry;
