import { useCallback } from 'react';

import useApi from '@proton/components/hooks/useApi';
import { TelemetryMeasurementGroups, TelemetryVpnAlwaysOnPolicyEvents } from '@proton/shared/lib/api/telemetry';
import { sendTelemetryReport } from '@proton/shared/lib/helpers/metrics';

export type ConfigureOpenedSource = 'call-to-action' | 'reconfigure';

export const useAlwaysOnPolicyTelemetry = () => {
    const api = useApi();

    const sendConfigureOpenedReport = useCallback(
        (source: ConfigureOpenedSource) => {
            void sendTelemetryReport({
                api,
                measurementGroup: TelemetryMeasurementGroups.vpnAlwaysOnPolicy,
                event: TelemetryVpnAlwaysOnPolicyEvents.configureOpened,
                dimensions: { source },
                delay: false,
            });
        },
        [api]
    );

    const sendGenerateStartReport = useCallback(() => {
        void sendTelemetryReport({
            api,
            measurementGroup: TelemetryMeasurementGroups.vpnAlwaysOnPolicy,
            event: TelemetryVpnAlwaysOnPolicyEvents.generateStart,
            delay: false,
        });
    }, [api]);

    const sendGenerateSuccessReport = useCallback(
        (restrictLogins: boolean) => {
            void sendTelemetryReport({
                api,
                measurementGroup: TelemetryMeasurementGroups.vpnAlwaysOnPolicy,
                event: TelemetryVpnAlwaysOnPolicyEvents.generateSuccess,
                dimensions: { restrictLogins: String(restrictLogins) },
                delay: false,
            });
        },
        [api]
    );

    const sendGenerateFailureReport = useCallback(() => {
        void sendTelemetryReport({
            api,
            measurementGroup: TelemetryMeasurementGroups.vpnAlwaysOnPolicy,
            event: TelemetryVpnAlwaysOnPolicyEvents.generateFailure,
            delay: false,
        });
    }, [api]);

    const sendInstructionsViewedReport = useCallback(() => {
        void sendTelemetryReport({
            api,
            measurementGroup: TelemetryMeasurementGroups.vpnAlwaysOnPolicy,
            event: TelemetryVpnAlwaysOnPolicyEvents.instructionsViewed,
            delay: false,
        });
    }, [api]);

    const sendRemoveModalOpenedReport = useCallback(() => {
        void sendTelemetryReport({
            api,
            measurementGroup: TelemetryMeasurementGroups.vpnAlwaysOnPolicy,
            event: TelemetryVpnAlwaysOnPolicyEvents.removeModalOpened,
            delay: false,
        });
    }, [api]);

    return {
        sendConfigureOpenedReport,
        sendGenerateStartReport,
        sendGenerateSuccessReport,
        sendGenerateFailureReport,
        sendInstructionsViewedReport,
        sendRemoveModalOpenedReport,
    };
};

export default useAlwaysOnPolicyTelemetry;
