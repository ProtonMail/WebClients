import { c } from 'ttag';

import { Button } from '@proton/atoms/Button/Button';
import { useSubscriptionModal } from '@proton/components/containers/payments/subscription/SubscriptionModalProvider';
import { SUBSCRIPTION_STEPS } from '@proton/components/containers/payments/subscription/constants';
import useDashboardPaymentFlow from '@proton/components/hooks/useDashboardPaymentFlow';
import type { PLANS } from '@proton/payments/core/constants';
import type { APP_NAMES } from '@proton/shared/lib/constants';

interface Props {
    app: APP_NAMES;
    plan: PLANS;
}
const DashboardUpgradePlanButton = ({ app, plan }: Props) => {
    const [openSubscriptionModal] = useSubscriptionModal();
    const telemetryFlow = useDashboardPaymentFlow(app);
    const handleExplorePlans = () => {
        openSubscriptionModal({
            step: SUBSCRIPTION_STEPS.CHECKOUT,
            plan: plan,
            metrics: { source: 'upsells' },
            telemetryFlow,
        });
    };
    return (
        <Button size="small" shape="underline" color="norm" onClick={handleExplorePlans} data-testid="cta:upgrade-plan">
            {c('specialoffer: Link').t`Upgrade`}
        </Button>
    );
};

export default DashboardUpgradePlanButton;
