import { useEffect } from 'react';

import { TelemetryAccountDashboardEvents } from '@proton/shared/lib/api/telemetry';
import { TelemetryMeasurementGroups } from '@proton/shared/lib/api/telemetry';
import type { APP_NAMES } from '@proton/shared/lib/constants';
import { sendTelemetryReport } from '@proton/shared/lib/helpers/metrics';

import useApi from './useApi';
import useShowVPNDashboard from './useShowVPNDashboard';

const useVPNDashboardPageLoadTelemetry = ({ app }: { app: APP_NAMES }) => {
    const api = useApi();
    const { showVPNDashboardVariant, canShowVPNDashboard } = useShowVPNDashboard(app);

    const sendTelemetry = async () => {
        await sendTelemetryReport({
            api,
            measurementGroup: TelemetryMeasurementGroups.accountDashboard,
            event: TelemetryAccountDashboardEvents.pageLoad,
            dimensions: { variant: showVPNDashboardVariant.name },
            delay: false,
        });
    };

    useEffect(() => {
        if (canShowVPNDashboard) {
            void sendTelemetry();
        }
    }, [showVPNDashboardVariant, canShowVPNDashboard]);
};

export default useVPNDashboardPageLoadTelemetry;
