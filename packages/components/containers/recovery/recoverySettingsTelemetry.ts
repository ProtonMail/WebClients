import { useCallback } from 'react';

import useApi from '@proton/components/hooks/useApi';
import { TelemetryMeasurementGroups, TelemetryRecoverySettingsEvents } from '@proton/shared/lib/api/telemetry';
import { sendTelemetryReport, telemetryReportsBatchQueue } from '@proton/shared/lib/helpers/metrics';

export const useRecoverySettingsTelemetry = () => {
    const api = useApi();

    const sendRecoveryPageLoad = useCallback(() => {
        void sendTelemetryReport({
            api,
            dimensions: { variant: 'A' },
            measurementGroup: TelemetryMeasurementGroups.accountRecoverySettings,
            event: TelemetryRecoverySettingsEvents.page_load,
            delay: false,
        });

        void telemetryReportsBatchQueue.flush();
    }, [api]);

    const sendRecoverySettingEnabled = useCallback(
        ({ setting }: { setting: string }) => {
            void sendTelemetryReport({
                api,
                measurementGroup: TelemetryMeasurementGroups.accountRecoverySettings,
                event: TelemetryRecoverySettingsEvents.setting_enabled,
                dimensions: { setting, variant: 'A' },
                delay: false,
            });

            void telemetryReportsBatchQueue.flush();
        },
        [api]
    );

    return { sendRecoveryPageLoad, sendRecoverySettingEnabled };
};
