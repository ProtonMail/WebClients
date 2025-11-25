import { c } from 'ttag';

import { useOrganization } from '@proton/account/organization/hooks';
import { useReferralInfo } from '@proton/account/referralInfo/hooks';
import { useSubscription } from '@proton/account/subscription/hooks';
import { useUser } from '@proton/account/user/hooks';
import { Button } from '@proton/atoms/Button/Button';
import SettingsParagraph from '@proton/components/containers/account/SettingsParagraph';
import SettingsSection from '@proton/components/containers/account/SettingsSection';
import useCancellationFlow from '@proton/components/containers/payments/subscription/cancellationFlow/useCancellationFlow';
import credits from '@proton/components/containers/referral/components/TrialInfo/credits.svg';
import getBoldFormattedText from '@proton/components/helpers/getBoldFormattedText';
import { isReferralTrial } from '@proton/payments/core/subscription/helpers';
import { useIsB2BTrial } from '@proton/payments/ui';
import type { APP_NAMES } from '@proton/shared/lib/constants';
import { BRAND_NAME, PASS_APP_NAME } from '@proton/shared/lib/constants';
import useFlag from '@proton/unleash/useFlag';

import useCancellationTelemetry from '../cancellationFlow/useCancellationTelemetry';
import { useCancelSubscriptionFlow } from './useCancelSubscriptionFlow';

export const CancelSubscriptionSection = ({ app }: { app: APP_NAMES }) => {
    const [user] = useUser();
    const { redirectToCancellationFlow, b2bAccess, b2cAccess } = useCancellationFlow();
    const { sendStartCancellationSectionReport } = useCancellationTelemetry();
    const { loadingCancelSubscription, cancelSubscriptionModals, cancelSubscription } = useCancelSubscriptionFlow({
        app,
    });
    const [subscription] = useSubscription();
    const [organization] = useOrganization();
    const isB2BTrial = useIsB2BTrial(subscription, organization);

    const [referralInfo] = useReferralInfo();
    const { referrerRewardAmount } = referralInfo.uiData;
    const isReferralExpansionEnabled = useFlag('ReferralExpansion');
    const isActiveReferralTrial = isReferralExpansionEnabled && isReferralTrial(subscription);

    if (loadingCancelSubscription) {
        return null;
    }

    const handleContinueClick = () => {
        if (isB2BTrial) {
            void cancelSubscription({});
        } else if (b2cAccess || b2bAccess) {
            redirectToCancellationFlow();
            sendStartCancellationSectionReport();
        } else {
            void cancelSubscription({ subscriptionReminderFlow: undefined, upsellPlanId: undefined, skipUpsell: true });
        }
    };

    let cancellationText = c('Info')
        .t`When you cancel, your subscription won't be renewed, but you can still enjoy plan benefits until the end of the subscription period. After that, you will be downgraded to the ${BRAND_NAME} Free plan.`;
    if (isB2BTrial) {
        cancellationText = c('b2b_trials_2025_Info')
            .t`When you cancel, your free trial won’t be converted to a paid subscription, but you can still enjoy plan benefits until the end of the trial period. After that, you will be downgraded to the ${BRAND_NAME} Free plan.`;
    } else if (isActiveReferralTrial) {
        cancellationText = c('Info')
            .t`When you cancel, your subscription won't start, but you can still enjoy plan benefits until the end of the trial period. After that, you will be downgraded to the ${BRAND_NAME} Free plan.`;
    }

    return (
        <>
            {cancelSubscriptionModals}
            <SettingsSection>
                <SettingsParagraph>{cancellationText}</SettingsParagraph>
                {user.hasPassLifetime && (
                    <SettingsParagraph>
                        {c('Info')
                            .t`You will keep lifetime access to ${PASS_APP_NAME} + SimpleLogin premium features if you cancel your subscription.`}
                    </SettingsParagraph>
                )}
                {isActiveReferralTrial && (
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
