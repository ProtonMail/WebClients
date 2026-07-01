import { useEffect } from 'react';

import { TelemetryAccountDashboardEvents, TelemetryMeasurementGroups } from '@proton/shared/lib/api/telemetry';
import type { APP_NAMES } from '@proton/shared/lib/constants';
import { sendTelemetryReport } from '@proton/shared/lib/helpers/metrics';
import type { FeatureFlagsWithVariant } from '@proton/unleash/UnleashFeatureFlagsVariants';

import type { TelemetryUserTier } from '../helpers/getTelemetryUserTier';
import { default as useShowDashboard } from './accounts/useShowDashboard';
import useApi from './useApi';

const useDashboardPageLoadTelemetry = ({
    app,
    dashboardName,
    userTier,
}: {
    app: APP_NAMES;
    dashboardName: FeatureFlagsWithVariant;
    userTier: TelemetryUserTier;
}) => {
    const api = useApi();
    const { canShowDashboard } = useShowDashboard(app, dashboardName);

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
