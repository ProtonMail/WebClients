import { useEffect } from 'react';

import { TelemetryAccountDashboardEvents, TelemetryMeasurementGroups } from '@proton/shared/lib/api/telemetry';
import type { APP_NAMES } from '@proton/shared/lib/constants';
import { sendTelemetryReport } from '@proton/shared/lib/helpers/metrics';
import type { FeatureFlagsWithVariant } from '@proton/unleash/UnleashFeatureFlagsVariants';

import { default as useShowDashboard } from './accounts/useShowDashboard';
import useApi from './useApi';

const useDashboardPageLoadTelemetry = ({
    app,
    dashboardName,
}: {
    app: APP_NAMES;
    dashboardName: FeatureFlagsWithVariant;
}) => {
    const api = useApi();
    const { variant, canShowDashboard } = useShowDashboard(app, dashboardName);

    const sendTelemetry = async () => {
        await sendTelemetryReport({
            api,
            measurementGroup: TelemetryMeasurementGroups.accountDashboard,
            event: TelemetryAccountDashboardEvents.pageLoad,
            dimensions: { variant: variant.name },
            delay: false,
        });
    };

    useEffect(() => {
        if (canShowDashboard) {
            void sendTelemetry();
        }
    }, [variant, canShowDashboard]);
};

export default useDashboardPageLoadTelemetry;
