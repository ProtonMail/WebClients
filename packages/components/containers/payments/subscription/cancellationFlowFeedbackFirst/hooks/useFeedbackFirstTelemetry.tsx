import { useSubscription } from '@proton/account/subscription/hooks';
import { useUser } from '@proton/account/user/hooks';
import { useUserSettings } from '@proton/account/userSettings/hooks';
import useApi from '@proton/components/hooks/useApi';
import {
    TelemetryAccountCancellationFlowFeedbackEvents,
    type TelemetryEvents,
    TelemetryMeasurementGroups,
} from '@proton/shared/lib/api/telemetry';
import { sendTelemetryReportWithBaseDimensions } from '@proton/shared/lib/helpers/metrics';

import { SUBSCRIPTION_CANCELLATION_REASONS } from '../../content/FeedbackDowngradeContent';
import type { FeedbackDowngradeFormData } from '../../content/interface';

const serviceProviderMap: Record<string, string> = {
    'Microsoft 365': 'microsoft365',
    'Google Workspace': 'googleWorkspace',
    Gmail: 'gmail',
    Outlook: 'outlook',
    Yahoo: 'yahoo',
    Other: 'other',
};

const getOtherServiceProvider = (feedback: FeedbackDowngradeFormData) => {
    return serviceProviderMap[feedback.ReasonDetails] || 'other';
};

export const useFeedbackFirstTelemetry = () => {
    const api = useApi();
    const [user] = useUser();
    const [subscription] = useSubscription();
    const [userSettings] = useUserSettings();

    const sendReport = (event: TelemetryEvents, dimensions?: Record<string, string>) => {
        void sendTelemetryReportWithBaseDimensions({
            api,
            user,
            subscription,
            userSettings,
            measurementGroup: TelemetryMeasurementGroups.accountCancellationFeedbackFirst,
            event,
            dimensions: {
                ...dimensions,
                couponCode: subscription?.CouponCode || undefined,
            },
            delay: false,
        });
    };

    const startCancellation = () => {
        sendReport(TelemetryAccountCancellationFlowFeedbackEvents.startCancellation);
    };

    const sendFeedbackReport = (feedback: FeedbackDowngradeFormData) => {
        const cancellationReason = feedback.Reason;

        const dimensions: Record<string, string> = { cancellationReason };
        if (cancellationReason === SUBSCRIPTION_CANCELLATION_REASONS.SWITCHING_TO_DIFFERENT_SERVICE) {
            dimensions.serviceProvider = getOtherServiceProvider(feedback);
        }

        sendReport(TelemetryAccountCancellationFlowFeedbackEvents.feedbackStep, dimensions);
    };

    const sendSecondStepReport = (feedback?: FeedbackDowngradeFormData) => {
        if (!feedback) {
            return;
        }

        const cancellationReason = feedback.Reason;
        sendReport(TelemetryAccountCancellationFlowFeedbackEvents.secondStep, { cancellationReason });
    };

    const sendConfirmCancellation = () => {
        sendReport(TelemetryAccountCancellationFlowFeedbackEvents.confirmCancellation);
    };

    return { startCancellation, sendFeedbackReport, sendSecondStepReport, sendConfirmCancellation };
};
