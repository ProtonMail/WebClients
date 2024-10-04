import useApi from '@proton/components/hooks/useApi';
import type { TelemetryEvents } from '@proton/shared/lib/api/telemetry';
import { TelemetryMeasurementGroups, TelemtryAccountCancellationEvents } from '@proton/shared/lib/api/telemetry';
import { sendTelemetryReport } from '@proton/shared/lib/helpers/metrics';
import type { SimpleMap } from '@proton/shared/lib/interfaces';

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

    const sendReport = (event: TelemetryEvents, dimensions?: SimpleMap<string>) => {
        void sendTelemetryReport({
            api,
            measurementGroup: TelemetryMeasurementGroups.accountCancellation,
            event,
            dimensions: {
                ...dimensions,
            },
        });
    };

    const sendStartCancellationReport = (source: 'cancellation_section' | 'cancellation_pricing') => {
        sendReport(TelemtryAccountCancellationEvents.startCancellation, {
            cancellation_start: source,
        });
    };

    const sendCancelPageReport = (source: 'confirm_cancel' | 'keep_plan') => {
        sendReport(TelemtryAccountCancellationEvents.cancelPage, {
            cancel_action: source,
        });
    };

    const sendCancelModalReport = (source: 'confirm_cancel' | 'keep_plan') => {
        sendReport(TelemtryAccountCancellationEvents.cancelModal, {
            cancel_modal_action: source,
        });
    };

    const sendFeedbackModalReport = (source: 'confirm_feedback' | 'cancel_feedback') => {
        sendReport(TelemtryAccountCancellationEvents.feedbackModal, {
            feedback_modal_action: source,
        });
    };

    const sendResubscribeModalReport = (source: 'resubscribe' | 'close_modal') => {
        sendReport(TelemtryAccountCancellationEvents.resubscribeModal, {
            resubscribe_modal_action: source,
        });
    };

    const sendDashboardReactivateReport = (source: string) => {
        sendReport(TelemtryAccountCancellationEvents.dashboardReactivate, {
            cancellation_reactivate: validateSource(source),
        });
    };

    return {
        sendStartCancellationSectionReport: () => sendStartCancellationReport('cancellation_section'),
        sendStartCancellationPricingReport: () => sendStartCancellationReport('cancellation_pricing'),
        sendCancelPageKeepPlanReport: () => sendCancelPageReport('keep_plan'),
        sendCancelPageConfirmCancelReport: () => sendCancelPageReport('confirm_cancel'),
        sendCancelModalKeepPlanReport: () => sendCancelModalReport('keep_plan'),
        sendCancelModalConfirmCancelReport: () => sendCancelModalReport('confirm_cancel'),
        sendFeedbackModalSubmitReport: () => sendFeedbackModalReport('confirm_feedback'),
        sendFeedbackModalCancelReport: () => sendFeedbackModalReport('cancel_feedback'),
        sendResubscribeModalResubcribeReport: () => sendResubscribeModalReport('resubscribe'),
        sendResubscribeModalCloseReport: () => sendResubscribeModalReport('close_modal'),
        sendDashboardReactivateReport,
    };
};

export default useCancellationTelemetry;
