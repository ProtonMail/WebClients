import { c } from 'ttag';

import { useUser } from '@proton/account/user/hooks';
import { Button } from '@proton/atoms';
import SettingsParagraph from '@proton/components/containers/account/SettingsParagraph';
import SettingsSection from '@proton/components/containers/account/SettingsSection';
import useCancellationFlow from '@proton/components/containers/payments/subscription/cancellationFlow/useCancellationFlow';
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

    if (loadingCancelSubscription) {
        return null;
    }

    const handleContinueClick = () => {
        if (b2cAccess || b2bAccess) {
            redirectToCancellationFlow();
            sendStartCancellationSectionReport();
        } else {
            void cancelSubscription({ subscriptionReminderFlow: undefined, upsellPlanId: undefined, skipUpsell: true });
        }
    };

    return (
        <>
            {cancelSubscriptionModals}
            <SettingsSection>
                <SettingsParagraph>{c('Info')
                    .t`When you cancel, your subscription won't be renewed, but you can still enjoy plan benefits until the end of the subscription period. After that, you will be downgraded to the ${BRAND_NAME} Free plan.`}</SettingsParagraph>
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
