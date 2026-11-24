import { c } from 'ttag';

import { Button } from '@proton/atoms/Button/Button';
import type { PLANS } from '@proton/payments/core/constants';
import { SUBSCRIPTION_STEPS } from '@proton/payments/core/subscription/subscription-modal-constants';

import { useSubscriptionModal } from '../../../../payments/subscription/subscriptionModalContext';

interface Props {
    plan: PLANS;
}
const DashboardUpgradePlanButton = ({ plan }: Props) => {
    const [openSubscriptionModal, loadingSubscriptionModal] = useSubscriptionModal();
    const handleExplorePlans = () => {
        void openSubscriptionModal({
            step: SUBSCRIPTION_STEPS.CHECKOUT,
            plan: plan,
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
