import { createContext, useCallback, useContext } from 'react';
import { useLocation } from 'react-router-dom';

import { selectRecoveryState } from '@proton/account/safetyReview/recoveryState/recoveryState';
import { selectSecurityCheckup } from '@proton/account/securityCheckup/slice';
import useSecurityCheckup from '@proton/components/hooks/securityCheckup/useSecurityCheckup';
import useApi from '@proton/components/hooks/useApi';
import { useSelector, useStore } from '@proton/redux-shared-store/sharedProvider';
import { TelemetryMeasurementGroups, TelemetryRecoverySettingsEvents } from '@proton/shared/lib/api/telemetry';
import { getAppFromPathnameSafe } from '@proton/shared/lib/apps/slugHelper';
import { sendTelemetryReport, telemetryReportsBatchQueue } from '@proton/shared/lib/helpers/metrics';

export type RecoverySettingsTelemetryVariant = 'A' | 'B';

const RecoverySettingsTelemetryVariantContext = createContext<RecoverySettingsTelemetryVariant>('A');

/** Set `value` to `B` for the account recovery settings redesign; defaults to `A` when omitted. */
export const RecoverySettingsTelemetryVariantProvider = RecoverySettingsTelemetryVariantContext.Provider;

export const useRecoverySettingsTelemetry = () => {
    const api = useApi();
    const variant = useContext(RecoverySettingsTelemetryVariantContext);
    const store = useStore();
    const { loading: recoveryStateLoading } = useSelector(selectRecoveryState);
    const { loading: securityCheckupLoading } = useSecurityCheckup();

    const location = useLocation();
    const appName = getAppFromPathnameSafe(location.pathname);

    const commonProps = {
        api,
        measurementGroup: TelemetryMeasurementGroups.accountRecoverySettings,
        delay: false,
    };

    const commonDimensions = {
        variant,
        app_name: appName,
        ...(variant === 'B' && { score_banner_variant: 'B2' }),
    };
    const loading = recoveryStateLoading || securityCheckupLoading;

    const getCurrentRecoveryTelemetryDimensions = useCallback(() => {
        const state = store.getState();
        const {
            recoveryScore: { score },
        } = selectRecoveryState(state);
        const { cohort } = selectSecurityCheckup(state);

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
