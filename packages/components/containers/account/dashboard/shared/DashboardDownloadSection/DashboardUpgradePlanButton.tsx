import { c } from 'ttag';

import { Button } from '@proton/atoms/Button/Button';
import type { PLANS } from '@proton/payments/core/constants';
import type { APP_NAMES } from '@proton/shared/lib/constants';

import useDashboardPaymentFlow from '../../../../../hooks/useDashboardPaymentFlow';
import { useSubscriptionModal } from '../../../../payments/subscription/SubscriptionModalProvider';
import { SUBSCRIPTION_STEPS } from '../../../../payments/subscription/constants';

interface Props {
    app: APP_NAMES;
    plan: PLANS;
}
const DashboardUpgradePlanButton = ({ app, plan }: Props) => {
    const [openSubscriptionModal, loadingSubscriptionModal] = useSubscriptionModal();
    const telemetryFlow = useDashboardPaymentFlow(app);
    const handleExplorePlans = () => {
        void openSubscriptionModal({
            step: SUBSCRIPTION_STEPS.CHECKOUT,
            plan: plan,
            telemetryFlow,
        });
    };
    return (
        <Button
            size="small"
            shape="underline"
            color="norm"
            onClick={handleExplorePlans}
            data-testid="cta:upgrade-plan"
            loading={loadingSubscriptionModal}
        >
            {c('specialoffer: Link').t`Upgrade`}
        </Button>
    );
};

export default DashboardUpgradePlanButton;
