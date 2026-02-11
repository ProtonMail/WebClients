import { useCallback } from 'react';
import { useLocation } from 'react-router-dom';

import useApi from '@proton/components/hooks/useApi';
import { TelemetryMeasurementGroups, TelemetryRecoverySettingsEvents } from '@proton/shared/lib/api/telemetry';
import { getAppFromPathnameSafe } from '@proton/shared/lib/apps/slugHelper';
import { sendTelemetryReport, telemetryReportsBatchQueue } from '@proton/shared/lib/helpers/metrics';

export const useRecoverySettingsTelemetry = () => {
    const api = useApi();

    const location = useLocation();
    const appName = getAppFromPathnameSafe(location.pathname);

    const commonProps = {
        api,
        measurementGroup: TelemetryMeasurementGroups.accountRecoverySettings,
        delay: false,
    };

    const commonDimensions = {
        variant: 'A',
        app_name: appName,
    };

    const sendRecoveryPageLoad = useCallback(() => {
        void sendTelemetryReport({
            ...commonProps,
            dimensions: { ...commonDimensions },
            event: TelemetryRecoverySettingsEvents.page_load,
        });

        void telemetryReportsBatchQueue.flush();
    }, [api, appName]);

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
        [api, appName]
    );

    return { sendRecoveryPageLoad, sendRecoverySettingEnabled };
};
