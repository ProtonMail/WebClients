import { useEffect } from 'react';

import { useApi } from '@proton/app-context/useApi';
import { TelemetryAccountDashboardEvents, TelemetryMeasurementGroups } from '@proton/shared/lib/api/telemetry';
import type { APP_NAMES } from '@proton/shared/lib/constants';
import { sendTelemetryReport } from '@proton/shared/lib/helpers/metrics';

import type { TelemetryUserTier } from '../helpers/getTelemetryUserTier';
import useShowDashboard, { useShowDriveDashboard } from './accounts/useShowDashboard';
import useShowVPNDashboard from './useShowVPNDashboard';

const useDashboardPageLoadTelemetry = ({ app, userTier }: { app: APP_NAMES; userTier: TelemetryUserTier }) => {
    const api = useApi();
    const { showDashboard } = useShowDashboard(app);
    const { canShowDashboard: canShowDriveDashboard } = useShowDriveDashboard(app);
    const { canShowVPNDashboard } = useShowVPNDashboard(app);
    const canShowDashboard = showDashboard || canShowDriveDashboard || canShowVPNDashboard;

    const sendTelemetry = async () => {
        await sendTelemetryReport({
            api,
            measurementGroup: TelemetryMeasurementGroups.accountDashboard,
            event: TelemetryAccountDashboardEvents.pageLoad,
            dimensions: { app, user_tier: userTier },
            delay: false,
        });
    };

    useEffect(() => {
        if (canShowDashboard) {
            void sendTelemetry();
        }
    }, [canShowDashboard]);
};

export default useDashboardPageLoadTelemetry;
