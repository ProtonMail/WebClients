import { createContext, useCallback, useContext } from 'react';
import { useLocation } from 'react-router-dom';

import { selectRecoveryState } from '@proton/account/safetyReview/recoveryState/recoveryState';
import { useRecoveryState } from '@proton/account/safetyReview/recoveryState/useRecoveryState';
import { useStore } from '@proton/redux-shared-store/sharedProvider';
import { TelemetryMeasurementGroups, TelemetryRecoverySettingsEvents } from '@proton/shared/lib/api/telemetry';
import { getAppFromPathnameSafe } from '@proton/shared/lib/apps/slugHelper';
import { sendTelemetryReport, telemetryReportsBatchQueue } from '@proton/shared/lib/helpers/metrics';

import useApi from '../../hooks/useApi';
import useConfig from '../../hooks/useConfig';

export type RecoverySettingsTelemetryVariant = 'A' | 'B';

const RecoverySettingsTelemetryVariantContext = createContext<RecoverySettingsTelemetryVariant>('A');

/** Set `value` to `B` for the account recovery settings redesign; defaults to `A` when omitted. */
export const RecoverySettingsTelemetryVariantProvider = RecoverySettingsTelemetryVariantContext.Provider;

export const useRecoverySettingsTelemetry = () => {
    const api = useApi();
    const variant = useContext(RecoverySettingsTelemetryVariantContext);
    const store = useStore();
    const { loading } = useRecoveryState();

    const { APP_NAME } = useConfig();
    const location = useLocation();
    // `app_name` is the product whose settings are being viewed, `host_app` is the web app serving them. Account
    // hosts every product behind a slug (/u/0/vpn/recovery), so the product comes from the path there. Standalone
    // settings apps and generic account settings have no slug, so both dimensions are the app itself.
    const appName = getAppFromPathnameSafe(location.pathname) ?? APP_NAME;

    const commonProps = {
        api,
        measurementGroup: TelemetryMeasurementGroups.accountRecoverySettings,
        delay: false,
    };

    const commonDimensions = {
        variant,
        app_name: appName,
        host_app: APP_NAME,
        ...(variant === 'B' && { score_banner_variant: 'B2' }),
    };

    const getCurrentRecoveryTelemetryDimensions = useCallback(() => {
        const state = store.getState();
        const {
            recoveryScore: { score },
            cohort,
        } = selectRecoveryState(state);

        return {
            cohort: cohort,
            score: String(score),
        };
    }, [store]);

    const sendRecoveryPageLoad = useCallback(() => {
        void sendTelemetryReport({
            ...commonProps,
            dimensions: { ...getCurrentRecoveryTelemetryDimensions(), ...commonDimensions },
            event: TelemetryRecoverySettingsEvents.page_load,
        });

        void telemetryReportsBatchQueue.flush();
    }, [api, appName, variant, getCurrentRecoveryTelemetryDimensions]);

    const sendAccountSafetyReviewClick = useCallback(() => {
        void sendTelemetryReport({
            ...commonProps,
            dimensions: { ...getCurrentRecoveryTelemetryDimensions(), ...commonDimensions },
            event: TelemetryRecoverySettingsEvents.account_safety_review_click,
        });

        void telemetryReportsBatchQueue.flush();
    }, [api, appName, variant, getCurrentRecoveryTelemetryDimensions]);

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
                | 'recovery_by_phone'
                | 'emergency_contacts'
                | 'recovery_contacts';
        }) => {
            void sendTelemetryReport({
                ...commonProps,
                event: TelemetryRecoverySettingsEvents.setting_enabled,
                dimensions: {
                    setting,
                    ...getCurrentRecoveryTelemetryDimensions(),
                    ...commonDimensions,
                },
            });

            void telemetryReportsBatchQueue.flush();
        },
        [api, appName, variant, getCurrentRecoveryTelemetryDimensions]
    );

    return { sendRecoveryPageLoad, sendAccountSafetyReviewClick, sendRecoverySettingEnabled, loading };
};
