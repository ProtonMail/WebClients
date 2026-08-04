import { useSubscription } from '@proton/account/subscription/hooks';
import { useUser } from '@proton/account/user/hooks';
import { useUserSettings } from '@proton/account/userSettings/hooks';
import useApi from '@proton/components/hooks/useApi';
import { getSilentApi } from '@proton/shared/lib/api/helpers/customConfig';
import {
    TelemetryAccountCancellationFlowFeedbackEvents,
    type TelemetryEvents,
    TelemetryMeasurementGroups,
    sendTelemetryData,
} from '@proton/shared/lib/api/telemetry';
import { getBaseTelemetryDimensions } from '@proton/shared/lib/helpers/metrics';

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

const SKIPPED_CANCELLATION_REASON = 'SKIPPED';

const getCancellationReason = (feedback: FeedbackDowngradeFormData) => {
    return feedback.Reason || SKIPPED_CANCELLATION_REASON;
};

export const useFeedbackFirstTelemetry = () => {
    const api = useApi();
    const [user] = useUser();
    const [subscription] = useSubscription();
    const [userSettings] = useUserSettings();

    const sendReport = (event: TelemetryEvents, dimensions?: Record<string, string>) => {
        const silentApi = getSilentApi(api);

        void silentApi(
            sendTelemetryData({
                MeasurementGroup: TelemetryMeasurementGroups.accountCancellationFeedbackFirst,
                Event: event,
                Dimensions: {
                    ...dimensions,
                    couponCode: subscription?.CouponCode || undefined,
                    feedbackFirstCancellationEnabled: 'true',
                    ...getBaseTelemetryDimensions({ user, subscription, userSettings }),
                },
            })
        );
    };

    const startCancellation = () => {
        sendReport(TelemetryAccountCancellationFlowFeedbackEvents.startCancellation);
    };

    const sendFeedbackReport = (feedback: FeedbackDowngradeFormData) => {
        const cancellationReason = getCancellationReason(feedback);

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

        const cancellationReason = getCancellationReason(feedback);
        sendReport(TelemetryAccountCancellationFlowFeedbackEvents.secondStep, { cancellationReason });
    };

    const sendConfirmCancellation = () => {
        sendReport(TelemetryAccountCancellationFlowFeedbackEvents.confirmCancellation);
    };

    const sendManagedExternally = () => {
        sendReport(TelemetryAccountCancellationFlowFeedbackEvents.managedExternally);
    };

    return {
        startCancellation,
        sendFeedbackReport,
        sendSecondStepReport,
        sendConfirmCancellation,
        sendManagedExternally,
    };
};
