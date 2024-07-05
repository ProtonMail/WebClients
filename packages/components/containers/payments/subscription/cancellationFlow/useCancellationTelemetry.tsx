import { useApi } from '@proton/components/hooks';
import { TelemetryMeasurementGroups, TelemtryAccountCancellationEvents } from '@proton/shared/lib/api/telemetry';
import { sendTelemetryReport } from '@proton/shared/lib/helpers/metrics';

export enum REACTIVATE_SOURCE {
    default = 'default',
    cancellationFlow = 'cancellation_flow',
    reminderModal = 'reminder_modal',
    banners = 'banners',
}

// We send a string since it comes from a query params, the value is validated in the function
const validateSource = (source: string) => {
    switch (source) {
        case 'cancellation_flow':
            return REACTIVATE_SOURCE.cancellationFlow;
        case 'reminder_modal':
            return REACTIVATE_SOURCE.reminderModal;
        case 'banners':
            return REACTIVATE_SOURCE.banners;
        default:
            return REACTIVATE_SOURCE.default;
    }
};

const useCancellationTelemetry = () => {
    const api = useApi();

    const sendStartCancellationReport = (source: 'cancellation_section' | 'cancellation_pricing') => {
        void sendTelemetryReport({
            api,
            measurementGroup: TelemetryMeasurementGroups.accountCancellation,
            event: TelemtryAccountCancellationEvents.startCancellation,
            dimensions: {
                cancellation_start: source,
            },
        });
    };

    const sendCancelPageKeepPlanReport = () => {
        void sendTelemetryReport({
            api,
            measurementGroup: TelemetryMeasurementGroups.accountCancellation,
            event: TelemtryAccountCancellationEvents.cancelPageKeepPlan,
        });
    };

    const sendCancelPageConfirmCancelReport = () => {
        void sendTelemetryReport({
            api,
            measurementGroup: TelemetryMeasurementGroups.accountCancellation,
            event: TelemtryAccountCancellationEvents.cancelPageConfirmCancel,
        });
    };

    const sendCancelModalKeepPlanReport = () => {
        void sendTelemetryReport({
            api,
            measurementGroup: TelemetryMeasurementGroups.accountCancellation,
            event: TelemtryAccountCancellationEvents.cancelModalKeepPlan,
        });
    };

    const sendCancelModalConfirmCancelReport = () => {
        void sendTelemetryReport({
            api,
            measurementGroup: TelemetryMeasurementGroups.accountCancellation,
            event: TelemtryAccountCancellationEvents.cancelModalConfirmCancel,
        });
    };

    const sendFeedbackModalSubmitReport = () => {
        void sendTelemetryReport({
            api,
            measurementGroup: TelemetryMeasurementGroups.accountCancellation,
            event: TelemtryAccountCancellationEvents.feedbackModalSubmit,
        });
    };

    const sendFeedbackModalCancelReport = () => {
        void sendTelemetryReport({
            api,
            measurementGroup: TelemetryMeasurementGroups.accountCancellation,
            event: TelemtryAccountCancellationEvents.feedbackModalCancel,
        });
    };

    const sendResubscribeModalResubcribeReport = () => {
        void sendTelemetryReport({
            api,
            measurementGroup: TelemetryMeasurementGroups.accountCancellation,
            event: TelemtryAccountCancellationEvents.resubscribeModalResubcribe,
        });
    };

    const sendResubscribeModalCloseReport = () => {
        void sendTelemetryReport({
            api,
            measurementGroup: TelemetryMeasurementGroups.accountCancellation,
            event: TelemtryAccountCancellationEvents.resubscribeModalClose,
        });
    };

    const sendDashboardReactivateReport = (source: string) => {
        void sendTelemetryReport({
            api,
            measurementGroup: TelemetryMeasurementGroups.accountCancellation,
            event: TelemtryAccountCancellationEvents.dashboardReactivate,
            dimensions: {
                cancellation_reactivate: validateSource(source),
            },
        });
    };

    return {
        sendStartCancellationSectionReport: () => sendStartCancellationReport('cancellation_section'),
        sendStartCancellationPricingReport: () => sendStartCancellationReport('cancellation_pricing'),
        sendCancelPageKeepPlanReport,
        sendCancelPageConfirmCancelReport,
        sendCancelModalKeepPlanReport,
        sendCancelModalConfirmCancelReport,
        sendFeedbackModalSubmitReport,
        sendFeedbackModalCancelReport,
        sendResubscribeModalResubcribeReport,
        sendResubscribeModalCloseReport,
        sendDashboardReactivateReport,
    };
};

export default useCancellationTelemetry;
