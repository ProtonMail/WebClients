import { c } from 'ttag';

import { Button } from '@proton/atoms/Button';
import useLoading from '@proton/hooks/useLoading';
import { APP_NAMES, BRAND_NAME, PLANS } from '@proton/shared/lib/constants';
import noop from '@proton/utils/noop';

import { SettingsParagraph, SettingsSection } from '../../account';
import { useFlag } from '../../unleash';
import { useB2CCancellationFlow } from './b2cCancellationFlow';
import { useCancelSubscriptionFlow } from './cancelSubscription';

const DowngradeSubscriptionSection = ({ app }: { app: APP_NAMES }) => {
    const [submitting, withSubmitting] = useLoading();

    const isNewCancellationFlowEnabled = useFlag('NewCancellationFlow');

    const { redirectToCancellationFlow, hasAccess: hasAccessToNewCancellationFlow } = useB2CCancellationFlow();
    const { cancelSubscription, cancelSubscriptionModals, loadingCancelSubscription } = useCancelSubscriptionFlow({
        app,
    });

    const handleCancelClick = () => {
        if (hasAccessToNewCancellationFlow && isNewCancellationFlowEnabled) {
            redirectToCancellationFlow();
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
