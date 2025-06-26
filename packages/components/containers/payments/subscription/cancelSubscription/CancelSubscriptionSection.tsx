import { c } from 'ttag';

import { useOrganization } from '@proton/account/organization/hooks';
import { useSubscription } from '@proton/account/subscription/hooks';
import { useUser } from '@proton/account/user/hooks';
import { Button } from '@proton/atoms';
import SettingsParagraph from '@proton/components/containers/account/SettingsParagraph';
import SettingsSection from '@proton/components/containers/account/SettingsSection';
import useCancellationFlow from '@proton/components/containers/payments/subscription/cancellationFlow/useCancellationFlow';
import { useIsB2BTrial } from '@proton/payments/ui';
import type { APP_NAMES } from '@proton/shared/lib/constants';
import { BRAND_NAME, PASS_APP_NAME } from '@proton/shared/lib/constants';

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

    const defaultCancellationText = c('Info')
        .t`When you cancel, your subscription won't be renewed, but you can still enjoy plan benefits until the end of the subscription period. After that, you will be downgraded to the ${BRAND_NAME} Free plan.`;

    const b2bTrialCancellationText = c('b2b_trials_2025_Info')
        .t`When you cancel, your free trial won’t be converted to a paid subscription, but you can still enjoy plan benefits until the end of the trial period. After that, you will be downgraded to the ${BRAND_NAME} Free plan.`;

    const cancellationText = isB2BTrial ? b2bTrialCancellationText : defaultCancellationText;

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
