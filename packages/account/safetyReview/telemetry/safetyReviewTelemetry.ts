import { TelemetryAccountSecurityCheckupEvents, TelemetryMeasurementGroups } from '@proton/shared/lib/api/telemetry';
import { sendTelemetryReport, telemetryReportsBatchQueue } from '@proton/shared/lib/helpers/metrics';
import type { Api } from '@proton/shared/lib/interfaces';
import type { SecurityCheckupSource } from '@proton/shared/lib/interfaces/securityCheckup';
import type { SecurityCheckupCohortType } from '@proton/shared/lib/interfaces/securityCheckup/SecurityCheckupCohort';

import type { SafetyReviewCohort } from './utils/getCohort';
import type { SafetyReviewSource } from './utils/getSource';

export const sendSafetyReviewPageLoadTelemetryReport = ({
    api,
    initialCohort,
    source,
    variant,
}: {
    api: Api;
    initialCohort: SecurityCheckupCohortType | SafetyReviewCohort;
    source: SecurityCheckupSource | SafetyReviewSource | undefined;
    variant: 'A' | 'B';
}) => {
    void sendTelemetryReport({
        api,
        measurementGroup: TelemetryMeasurementGroups.accountSecurityCheckup,
        event: TelemetryAccountSecurityCheckupEvents.pageLoad,
        dimensions: {
            initialCohort,
            source,
            variant,
        },
        delay: false,
    });

    void telemetryReportsBatchQueue.flush();
};

export const getSafetyReviewCohortChangeTelemetry = ({
    api,
    initialCohort,
    variant,
}: {
    api: Api;
    initialCohort: SecurityCheckupCohortType | SafetyReviewCohort;
    variant: 'A' | 'B';
}) => {
    const commonProps = {
        api,
        measurementGroup: TelemetryMeasurementGroups.accountSecurityCheckup,
        delay: false,
        dimensions: {
            initialCohort,
            variant,
        },
    };

    return {
        sendCompleteRecoveryMultiple: () => {
            void sendTelemetryReport({
                ...commonProps,
                event: TelemetryAccountSecurityCheckupEvents.completeRecoveryMultiple,
            });
        },
        sendCompleteRecoverySingle: ({
            singleMethod,
        }: {
            singleMethod: 'phrase' | 'emergency-contacts' | 'email' | 'phone' | 'unknown';
        }) => {
            void sendTelemetryReport({
                ...commonProps,
                event: TelemetryAccountSecurityCheckupEvents.completeRecoverySingle,
                dimensions: {
                    ...commonProps.dimensions,
                    singleMethod,
                },
            });
        },
        sendAccountRecoveryEnabled: () => {
            void sendTelemetryReport({
                ...commonProps,
                event: TelemetryAccountSecurityCheckupEvents.accountRecoveryEnabled,
            });
        },
        sendCompleteRecoverySentinel: () => {
            void sendTelemetryReport({
                ...commonProps,
                event: TelemetryAccountSecurityCheckupEvents.completeRecoverySentinel,
            });
        },
        sendSentinelRecommendations: () => {
            void sendTelemetryReport({
                ...commonProps,
                event: TelemetryAccountSecurityCheckupEvents.sentinelRecommendations,
            });
        },
    };
};
