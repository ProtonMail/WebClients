import { useCallback } from 'react';

import { useApi } from '@proton/app-context/useApi';
import { TelemetryMeasurementGroups, TelemetryVpnAlwaysOnPolicyEvents } from '@proton/shared/lib/api/telemetry';
import { sendTelemetryReport } from '@proton/shared/lib/helpers/metrics';

type ConfigureOpenedSource = 'request-to-configure' | 'reconfigure-new-profile';
type ClientDownloadSource = 'build' | 'download-page';
type InstructionsPlatform = 'windows' | 'macos';

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

    const sendGenerateSuccessReport = useCallback(() => {
        void sendTelemetryReport({
            api,
            measurementGroup: TelemetryMeasurementGroups.vpnAlwaysOnPolicy,
            event: TelemetryVpnAlwaysOnPolicyEvents.generateSuccess,
            delay: false,
        });
    }, [api]);

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

    const sendLearnMoreClickedReport = useCallback(
        (platform: InstructionsPlatform) => {
            void sendTelemetryReport({
                api,
                measurementGroup: TelemetryMeasurementGroups.vpnAlwaysOnPolicy,
                event: TelemetryVpnAlwaysOnPolicyEvents.learnMoreClicked,
                dimensions: { platform },
                delay: false,
            });
        },
        [api]
    );

    const sendRemoveModalOpenedReport = useCallback(() => {
        void sendTelemetryReport({
            api,
            measurementGroup: TelemetryMeasurementGroups.vpnAlwaysOnPolicy,
            event: TelemetryVpnAlwaysOnPolicyEvents.removeModalOpened,
            delay: false,
        });
    }, [api]);

    const sendDownloadLatestClickedReport = useCallback(
        (source: ClientDownloadSource, version: string) => {
            void sendTelemetryReport({
                api,
                measurementGroup: TelemetryMeasurementGroups.vpnAlwaysOnPolicy,
                event: TelemetryVpnAlwaysOnPolicyEvents.downloadLatestClicked,
                dimensions: { source, version },
                delay: false,
            });
        },
        [api]
    );

    const sendClientDownloadClickedReport = useCallback(
        (source: ClientDownloadSource, version: string) => {
            void sendTelemetryReport({
                api,
                measurementGroup: TelemetryMeasurementGroups.vpnAlwaysOnPolicy,
                event: TelemetryVpnAlwaysOnPolicyEvents.clientDownloadClicked,
                dimensions: { source, version },
                delay: false,
            });
        },
        [api]
    );

    return {
        sendConfigureOpenedReport,
        sendGenerateStartReport,
        sendGenerateSuccessReport,
        sendGenerateFailureReport,
        sendInstructionsViewedReport,
        sendLearnMoreClickedReport,
        sendRemoveModalOpenedReport,
        sendDownloadLatestClickedReport,
        sendClientDownloadClickedReport,
    };
};

export default useAlwaysOnPolicyTelemetry;
