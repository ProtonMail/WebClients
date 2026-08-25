import { useCallback } from 'react';
import { useLocation } from 'react-router-dom';

import { useApi } from '@proton/app-context/useApi';
import { useConfig } from '@proton/app-context/useConfig';
import { TelemetryMeasurementGroups, TelemetryPasswordReminderEvents } from '@proton/shared/lib/api/telemetry';
import { getClientID } from '@proton/shared/lib/apps/helper';
import { getAppFromPathnameSafe } from '@proton/shared/lib/apps/slugHelper';
import { getAppVersionStr } from '@proton/shared/lib/fetch/headers';
import { sendTelemetryReport, telemetryReportsBatchQueue } from '@proton/shared/lib/helpers/metrics';

import { usePasswordReminder } from './hooks';

export type PasswordReminderSource = 'top_banner' | 'recovery_settings' | 'password_settings';

export const usePasswordReminderTelemetry = () => {
    const api = useApi();
    const { APP_NAME, APP_VERSION } = useConfig();
    const location = useLocation();
    const appName = getAppFromPathnameSafe(location.pathname) ?? APP_NAME;
    const hostAppName = getAppVersionStr(getClientID(APP_NAME), APP_VERSION);

    // Both are computed by the password reminder listener from the same user/organization
    // state that decides whether the feature is available at all.
    const { accountType, isEnforced } = usePasswordReminder();

    const commonProps = {
        api,
        measurementGroup: TelemetryMeasurementGroups.accountPasswordReminder,
        delay: false,
    };

    const commonDimensions = {
        app_name: appName,
        host_app_name: hostAppName,
        account_type: accountType ?? 'unknown',
        enforced: isEnforced ? 'true' : 'false',
    };

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

    const sendBannerDisplay = useCallback(
        (source: PasswordReminderSource) => {
            sendReport(TelemetryPasswordReminderEvents.banner_display, { source, ...commonDimensions });
        },
        [sendReport, commonDimensions]
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

    const sendEnforcementChange = useCallback(
        (enforced: boolean) => {
            sendReport(
                enforced
                    ? TelemetryPasswordReminderEvents.enforcement_enable
                    : TelemetryPasswordReminderEvents.enforcement_disable,
                commonDimensions
            );
        },
        [sendReport, commonDimensions]
    );

    return {
        sendBannerDisplay,
        sendOpen,
        sendSuccess,
        sendWrongPassword,
        sendApiError,
        sendClose,
        sendDismiss,
        sendForgotPasswordExit,
        sendEnable,
        sendDisable,
        sendEnforcementChange,
    };
};
