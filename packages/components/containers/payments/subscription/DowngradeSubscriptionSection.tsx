import { c } from 'ttag';

import { Button } from '@proton/atoms';
import SettingsParagraph from '@proton/components/containers/account/SettingsParagraph';
import SettingsSection from '@proton/components/containers/account/SettingsSection';
import useCancellationFlow from '@proton/components/containers/payments/subscription/cancellationFlow/useCancellationFlow';
import useLoading from '@proton/hooks/useLoading';
import type { APP_NAMES } from '@proton/shared/lib/constants';
import { BRAND_NAME, PLANS } from '@proton/shared/lib/constants';
import noop from '@proton/utils/noop';

import { useCancelSubscriptionFlow } from './cancelSubscription';
import useCancellationTelemetry from './cancellationFlow/useCancellationTelemetry';

const DowngradeSubscriptionSection = ({ app }: { app: APP_NAMES }) => {
    const [submitting, withSubmitting] = useLoading();

    const { redirectToCancellationFlow, b2cAccess, b2bAccess } = useCancellationFlow();
    const { sendStartCancellationSectionReport } = useCancellationTelemetry();
    const { cancelSubscription, cancelSubscriptionModals, loadingCancelSubscription } = useCancelSubscriptionFlow({
        app,
    });

    const handleCancelClick = () => {
        if (b2bAccess || b2cAccess) {
            redirectToCancellationFlow();
            sendStartCancellationSectionReport();
        } else {
            void withSubmitting(cancelSubscription().catch(noop));
        }
    };

    return (
        <SettingsSection>
            {cancelSubscriptionModals}
            <SettingsParagraph>
                {c('Info')
                    .t`When you cancel your current paid subscription, the balance of your subscription will be returned as account credits and you will be downgraded to the ${BRAND_NAME} ${PLANS.FREE} plan.`}
            </SettingsParagraph>
            <Button
                shape="outline"
                disabled={loadingCancelSubscription}
                loading={submitting}
                onClick={handleCancelClick}
                data-testid="UnsubscribeButton"
            >
                {c('Action').t`Continue`}
            </Button>
        </SettingsSection>
    );
};

export default DowngradeSubscriptionSection;
