import { useCallback } from 'react';

import useApi from '@proton/components/hooks/useApi';
import { TelemetryMeasurementGroups, TelemetryRecoverySettingsEvents } from '@proton/shared/lib/api/telemetry';
import { sendTelemetryReport, telemetryReportsBatchQueue } from '@proton/shared/lib/helpers/metrics';

export const useRecoverySettingsTelemetry = () => {
    const api = useApi();

    const commonProps = {
        api,
        measurementGroup: TelemetryMeasurementGroups.accountRecoverySettings,
        delay: false,
    };

    const commonDimensions = {
        variant: 'A',
    };

    const sendRecoveryPageLoad = useCallback(() => {
        void sendTelemetryReport({
            ...commonProps,
            dimensions: { ...commonDimensions },
            event: TelemetryRecoverySettingsEvents.page_load,
        });

        void telemetryReportsBatchQueue.flush();
    }, [api]);

    const sendRecoverySettingEnabled = useCallback(
        ({
            setting,
        }: {
            setting:
                | 'qr_code_sign_in'
                | 'session_recovery'
                | 'recovery_file_download'
                | 'recovery_phrase'
                | 'device_recovery'
                | 'recovery_by_email'
                | 'recovery_by_phone';
        }) => {
            void sendTelemetryReport({
                ...commonProps,
                event: TelemetryRecoverySettingsEvents.setting_enabled,
                dimensions: { setting, ...commonDimensions },
            });

            void telemetryReportsBatchQueue.flush();
        },
        [api]
    );

    return { sendRecoveryPageLoad, sendRecoverySettingEnabled };
};
