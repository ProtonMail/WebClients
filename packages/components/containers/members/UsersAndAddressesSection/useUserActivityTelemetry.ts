import { useCallback } from 'react';

import useApi from '@proton/components/hooks/useApi';
import { TelemetryMeasurementGroups, TelemetryVpnB2bUserActivityEvents } from '@proton/shared/lib/api/telemetry';
import { sendTelemetryReport } from '@proton/shared/lib/helpers/metrics';

const useUserActivityTelemetry = () => {
    const api = useApi();

    const trackConnectionUpsellShown = useCallback(() => {
        void sendTelemetryReport({
            api,
            measurementGroup: TelemetryMeasurementGroups.vpnB2bUserActivity,
            event: TelemetryVpnB2bUserActivityEvents.upsell_shown,
            delay: false,
        });
    }, [api]);

    const trackConnectionUpsellLearnMoreClicked = useCallback(() => {
        void sendTelemetryReport({
            api,
            measurementGroup: TelemetryMeasurementGroups.vpnB2bUserActivity,
            event: TelemetryVpnB2bUserActivityEvents.upsell_learn_more_clicked,
            delay: false,
        });
    }, [api]);

    const trackConnectionUpsellUpgradeStarted = useCallback(() => {
        void sendTelemetryReport({
            api,
            measurementGroup: TelemetryMeasurementGroups.vpnB2bUserActivity,
            event: TelemetryVpnB2bUserActivityEvents.upsell_upgrade_started,
            delay: false,
        });
    }, [api]);

    const trackConnectionUpsellDismissed = useCallback(() => {
        void sendTelemetryReport({
            api,
            measurementGroup: TelemetryMeasurementGroups.vpnB2bUserActivity,
            event: TelemetryVpnB2bUserActivityEvents.upsell_dismissed,
            delay: false,
        });
    }, [api]);

    const trackGatewayMonitorEnableClicked = useCallback(() => {
        void sendTelemetryReport({
            api,
            measurementGroup: TelemetryMeasurementGroups.vpnB2bUserActivity,
            event: TelemetryVpnB2bUserActivityEvents.enable_clicked,
            delay: false,
        });
    }, [api]);

    return {
        trackConnectionUpsellShown,
        trackConnectionUpsellLearnMoreClicked,
        trackConnectionUpsellUpgradeStarted,
        trackConnectionUpsellDismissed,
        trackGatewayMonitorEnableClicked,
    };
};

export default useUserActivityTelemetry;
