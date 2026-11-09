import { useState } from 'react';

import { useEntitlementCatalog } from '@proton/account/entitlementCatalog/hooks';
import { isManagedExternally } from '@proton/payments/core/subscription/helpers';
import type { Subscription } from '@proton/payments/core/subscription/interface';
import { getTrialInfoForSingleSubscription } from '@proton/payments/core/trials';
import { TelemetryAccountCancellationFlowFeedbackEvents } from '@proton/shared/lib/api/telemetry';
import type { APP_NAMES } from '@proton/shared/lib/constants';

import useModalState from '../../../../components/modalTwo/useModalState';
import InAppPurchaseModal from '../InAppPurchaseModal';
import useCancellationFlow, { getCanUseCancellationReminder } from '../cancellationFlow/useCancellationFlow';
import useCancellationTelemetry from '../cancellationFlow/useCancellationTelemetry';
import { useFeedbackFirstCancellationFlow } from '../cancellationFlowFeedbackFirst/hooks/useFeedbackFirstCancellationFlow';
import { getFeedbackFirstEligibility } from '../cancellationFlowFeedbackFirst/hooks/useFeedbackFirstEligibility';
import { useSendFeedbackFirstReport } from '../cancellationFlowFeedbackFirst/hooks/useFeedbackFirstTelemetry';
import { useCancelSubscriptionFlow } from './useCancelSubscriptionFlow';

export const useStartCancellation = ({ app }: { app: APP_NAMES }) => {
    const { redirectToCancellationFlow } = useCancellationFlow();
    const { sendStartCancellationSectionReport } = useCancellationTelemetry();
    const { loadingCancelSubscription, cancelSubscriptionModals, cancelSubscription } = useCancelSubscriptionFlow({
        app,
    });
    const { startFlow: startFeedbackFirstFlow, modals: feedbackFirstModals } = useFeedbackFirstCancellationFlow();
    const sendFeedbackFirstReport = useSendFeedbackFirstReport();
    const [entitlementCatalog, loadingEntitlementCatalog] = useEntitlementCatalog();
    const [storeSubscription, setStoreSubscription] = useState<Subscription>();
    const [inAppPurchaseModalProps, setInAppPurchaseModalOpen, renderInAppPurchaseModal] = useModalState();

    const startCancellation = (subscription: Subscription) => {
        const { isB2BTrial } = getTrialInfoForSingleSubscription(entitlementCatalog, subscription);
        const { hasB2BAccess, hasB2CAccess } = getFeedbackFirstEligibility(subscription);

        if (isManagedExternally(subscription)) {
            setStoreSubscription(subscription);
            setInAppPurchaseModalOpen(true);
        } else if (isB2BTrial) {
            void cancelSubscription({ subscription });
        } else if (hasB2BAccess || hasB2CAccess) {
            startFeedbackFirstFlow(subscription);
            sendFeedbackFirstReport(subscription, TelemetryAccountCancellationFlowFeedbackEvents.startCancellation);
        } else if (getCanUseCancellationReminder(subscription)) {
            redirectToCancellationFlow(subscription);
            sendStartCancellationSectionReport();
        } else {
            void cancelSubscription({
                subscription,
                subscriptionReminderFlow: undefined,
                upsellPlanId: undefined,
                skipUpsell: true,
            });
        }
    };

    return {
        startCancellation,
        modals: (
            <>
                {cancelSubscriptionModals}
                {feedbackFirstModals}
                {renderInAppPurchaseModal && storeSubscription && (
                    <InAppPurchaseModal {...inAppPurchaseModalProps} subscription={storeSubscription} />
                )}
            </>
        ),
        loading: loadingCancelSubscription || loadingEntitlementCatalog,
    };
};
