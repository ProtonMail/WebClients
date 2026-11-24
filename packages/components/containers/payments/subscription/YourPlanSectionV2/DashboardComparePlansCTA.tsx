import { c } from 'ttag';

import { useSubscription } from '@proton/account/subscription/hooks';
import { Button } from '@proton/atoms/Button/Button';
import { IcChevronRight } from '@proton/icons/icons/IcChevronRight';
import { getAudienceFromSubscription } from '@proton/payments/core/subscription/helpers';
import { SUBSCRIPTION_STEPS } from '@proton/payments/core/subscription/subscription-modal-constants';

import { useSubscriptionModal } from '../subscriptionModalContext';

const DashboardComparePlansCTA = () => {
    const [subscription] = useSubscription();
    const [openSubscriptionModal, loadingSubscriptionModal] = useSubscriptionModal();

    const handleExplorePlans = () => {
        void openSubscriptionModal({
            step: SUBSCRIPTION_STEPS.PLAN_SELECTION,
            defaultAudience: getAudienceFromSubscription(subscription),
        });
    };

    return (
        <Button color="norm" size="small" shape="ghost" loading={loadingSubscriptionModal} onClick={handleExplorePlans}>
            {c('Action').t`Compare all plans`}
            <IcChevronRight className="shrink-0 ml-1 rtl:mirror" />
        </Button>
    );
};

export default DashboardComparePlansCTA;
