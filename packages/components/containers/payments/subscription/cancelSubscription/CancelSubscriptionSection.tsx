import { c } from 'ttag';

import { useEntitlementCatalog } from '@proton/account/entitlementCatalog/hooks';
import { usePaymentMethods } from '@proton/account/paymentMethods/hooks';
import { useReferralInfo } from '@proton/account/referralInfo/hooks';
import { useSubscription } from '@proton/account/subscription/hooks';
import { useUser } from '@proton/account/user/hooks';
import { Button } from '@proton/atoms/Button/Button';
import type { Subscription } from '@proton/payments/core/subscription/interface';
import { getTrialInfoForSingleSubscription } from '@proton/payments/core/trials';
import { isPaidSubscription } from '@proton/payments/core/type-guards';
import type { APP_NAMES } from '@proton/shared/lib/constants';
import { BRAND_NAME, PASS_APP_NAME } from '@proton/shared/lib/constants';

import getBoldFormattedText from '../../../../helpers/getBoldFormattedText';
import SettingsParagraph from '../../../account/SettingsParagraph';
import SettingsSection from '../../../account/SettingsSection';
import credits from '../../../referral/components/ReferralTrialInfo/credits.svg';
import useCancellationFlow, { getCanUseCancellationReminder } from '../cancellationFlow/useCancellationFlow';
import useCancellationTelemetry from '../cancellationFlow/useCancellationTelemetry';
import { useFeedbackFirstCancellationFlow } from '../cancellationFlowFeedbackFirst/hooks/useFeedbackFirstCancellationFlow';
import { useFeedbackFirstEligibility } from '../cancellationFlowFeedbackFirst/hooks/useFeedbackFirstEligibility';
import { useFeedbackFirstTelemetry } from '../cancellationFlowFeedbackFirst/hooks/useFeedbackFirstTelemetry';
import { useCancelSubscriptionFlow } from './useCancelSubscriptionFlow';

interface ContentProps {
    app: APP_NAMES;
    subscription: Subscription;
}

const CancelSubscriptionSectionContent = ({ app, subscription }: ContentProps) => {
    const [user] = useUser();
    const { redirectToCancellationFlow } = useCancellationFlow();
    const { hasB2BAccess: feedbackFirstB2BAccess, hasB2CAccess: feedbackFirstB2CAccess } =
        useFeedbackFirstEligibility(subscription);
    const { sendStartCancellationSectionReport } = useCancellationTelemetry();
    const { loadingCancelSubscription, cancelSubscriptionModals, cancelSubscription } = useCancelSubscriptionFlow({
        app,
    });
    const { startFlow: startFeedbackFirstFlow, modals: feedbackFirstModals } =
        useFeedbackFirstCancellationFlow(subscription);
    const [paymentMethods, loadingPaymentMethods] = usePaymentMethods();
    const [entitlementCatalog, loadingEntitlementCatalog] = useEntitlementCatalog();
    const { isB2BTrial, isReferralTrial } = getTrialInfoForSingleSubscription(entitlementCatalog, subscription);
    const [referralInfo] = useReferralInfo();
    const { referrerRewardAmount } = referralInfo.uiData;

    const { startCancellation } = useFeedbackFirstTelemetry(subscription);

    if (loadingCancelSubscription || loadingPaymentMethods || loadingEntitlementCatalog) {
        return null;
    }

    const hasPaymentMethod = !!paymentMethods?.length;

    const handleContinueClick = () => {
        if (isB2BTrial) {
            void cancelSubscription({ subscription });
        } else if (feedbackFirstB2BAccess || feedbackFirstB2CAccess) {
            startFeedbackFirstFlow();
            startCancellation();
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

    let cancellationText = c('Info')
        .t`When you cancel, your subscription won't be renewed, but you can still enjoy plan benefits until the end of the subscription period. After that, you will be downgraded to the ${BRAND_NAME} Free plan.`;
    if (isB2BTrial) {
        cancellationText = hasPaymentMethod
            ? c('b2b_trials_2025_Info')
                  .t`When you cancel, your free trial won’t be converted to a paid subscription, but you can still enjoy plan benefits until the end of the trial period. After that, you will be downgraded to the ${BRAND_NAME} Free plan.`
            : c('b2b_trials_2025_Info')
                  .t`When you cancel, your free trial won’t be converted to a paid subscription, but you can still enjoy plan benefits until the end of the trial period.`;
    } else if (isReferralTrial) {
        cancellationText = c('Info')
            .t`When you cancel, your subscription won't start, but you can still enjoy plan benefits until the end of the trial period. After that, you will be downgraded to the ${BRAND_NAME} Free plan.`;
    }

    return (
        <>
            {cancelSubscriptionModals}
            {feedbackFirstModals}
            <SettingsSection>
                <SettingsParagraph>{cancellationText}</SettingsParagraph>
                {user.hasPassLifetime && (
                    <SettingsParagraph>
                        {c('Info')
                            .t`You will keep lifetime access to ${PASS_APP_NAME} + SimpleLogin premium features if you cancel your subscription.`}
                    </SettingsParagraph>
                )}
                {isReferralTrial && (
                    <div className="flex gap-3 mb-6">
                        <img src={credits} alt="" />
                        <p>
                            {getBoldFormattedText(
                                c('Referral')
                                    .t`If you cancel, you will lose your **${referrerRewardAmount}** credit reward.`
                            )}
                        </p>
                    </div>
                )}
                <Button
                    onClick={handleContinueClick}
                    data-testid="CancelSubscriptionButton"
                    shape="outline"
                    disabled={loadingCancelSubscription}
                >
                    {c('Action').t`Continue`}
                </Button>
            </SettingsSection>
        </>
    );
};

export const CancelSubscriptionSection = ({ app }: { app: APP_NAMES }) => {
    const [subscription] = useSubscription();

    if (!isPaidSubscription(subscription)) {
        return null;
    }

    return <CancelSubscriptionSectionContent app={app} subscription={subscription} />;
};
