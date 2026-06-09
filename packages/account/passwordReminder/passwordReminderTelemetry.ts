import { useCallback } from 'react';
import { useLocation } from 'react-router-dom';

import useApi from '@proton/components/hooks/useApi';
import useConfig from '@proton/components/hooks/useConfig';
import { TelemetryMeasurementGroups, TelemetryPasswordReminderEvents } from '@proton/shared/lib/api/telemetry';
import { getClientID } from '@proton/shared/lib/apps/helper';
import { getAppFromPathnameSafe } from '@proton/shared/lib/apps/slugHelper';
import { getAppVersionStr } from '@proton/shared/lib/fetch/headers';
import { sendTelemetryReport, telemetryReportsBatchQueue } from '@proton/shared/lib/helpers/metrics';

export type PasswordReminderSource = 'top_banner' | 'recovery_settings';

export const usePasswordReminderTelemetry = () => {
    const api = useApi();
    const { APP_NAME, APP_VERSION } = useConfig();
    const location = useLocation();
    const appName = getAppFromPathnameSafe(location.pathname) ?? APP_NAME;
    const hostAppName = getAppVersionStr(getClientID(APP_NAME), APP_VERSION);

    const commonProps = {
        api,
        measurementGroup: TelemetryMeasurementGroups.accountPasswordReminder,
        delay: false,
    };

    const commonDimensions = { app_name: appName, host_app_name: hostAppName };

    const sendReport = useCallback(
        (event: TelemetryPasswordReminderEvents, dimensions: Record<string, string | undefined>) => {
            void sendTelemetryReport({
                ...commonProps,
                event,
                dimensions,
            });

            void telemetryReportsBatchQueue.flush();
        },
        [api]
    );

    const sendOpen = useCallback(
        (source: PasswordReminderSource) => {
            sendReport(TelemetryPasswordReminderEvents.open, { source, ...commonDimensions });
        },
        [sendReport, commonDimensions]
    );

    const sendSuccess = useCallback(() => {
        sendReport(TelemetryPasswordReminderEvents.success, commonDimensions);
    }, [sendReport, commonDimensions]);

    const sendWrongPassword = useCallback(() => {
        sendReport(TelemetryPasswordReminderEvents.wrong_password, commonDimensions);
    }, [sendReport, commonDimensions]);

    const sendApiError = useCallback(() => {
        sendReport(TelemetryPasswordReminderEvents.api_error, commonDimensions);
    }, [sendReport, commonDimensions]);

    const sendClose = useCallback(() => {
        sendReport(TelemetryPasswordReminderEvents.close, commonDimensions);
    }, [sendReport, commonDimensions]);

    const sendDismiss = useCallback(() => {
        sendReport(TelemetryPasswordReminderEvents.dismiss, commonDimensions);
    }, [sendReport, commonDimensions]);

    const sendForgotPasswordExit = useCallback(() => {
        sendReport(TelemetryPasswordReminderEvents.forgot_password_exit, commonDimensions);
    }, [sendReport, commonDimensions]);

    const sendEnable = useCallback(() => {
        sendReport(TelemetryPasswordReminderEvents.enable, commonDimensions);
    }, [sendReport, commonDimensions]);

    const sendDisable = useCallback(() => {
        sendReport(TelemetryPasswordReminderEvents.disable, commonDimensions);
    }, [sendReport, commonDimensions]);

    return {
        sendOpen,
        sendSuccess,
        sendWrongPassword,
        sendApiError,
        sendClose,
        sendDismiss,
        sendForgotPasswordExit,
        sendEnable,
        sendDisable,
    };
};
