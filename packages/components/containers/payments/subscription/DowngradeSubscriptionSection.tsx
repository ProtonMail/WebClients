import { c } from 'ttag';

import { Button } from '@proton/atoms/Button/Button';
import useLoading from '@proton/hooks/useLoading';
import { PLANS } from '@proton/payments/core/constants';
import type { APP_NAMES } from '@proton/shared/lib/constants';
import { BRAND_NAME } from '@proton/shared/lib/constants';
import noop from '@proton/utils/noop';

import SettingsParagraph from '../../account/SettingsParagraph';
import SettingsSection from '../../account/SettingsSection';
import { useCancelSubscriptionFlow } from './cancelSubscription/useCancelSubscriptionFlow';
import useCancellationFlow from './cancellationFlow/useCancellationFlow';
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
            void withSubmitting(cancelSubscription({}).catch(noop));
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
