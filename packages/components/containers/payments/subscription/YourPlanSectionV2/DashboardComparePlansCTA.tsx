import { c } from 'ttag';

import { useSubscription } from '@proton/account/subscription/hooks';
import { Button } from '@proton/atoms/Button/Button';
import { IcChevronRight } from '@proton/icons/icons/IcChevronRight';
import { getAudienceFromSubscription } from '@proton/payments/core/subscription/helpers';

import { useSubscriptionModal } from '../SubscriptionModalProvider';
import { SUBSCRIPTION_STEPS } from '../constants';

const DashboardComparePlansCTA = () => {
    const [subscription] = useSubscription();
    const [openSubscriptionModal] = useSubscriptionModal();

    const handleExplorePlans = () => {
        openSubscriptionModal({
            step: SUBSCRIPTION_STEPS.PLAN_SELECTION,
            metrics: { source: 'upsells' },
            defaultAudience: getAudienceFromSubscription(subscription),
        });
    };

    return (
        <Button color="norm" size="small" shape="ghost" onClick={handleExplorePlans}>
            {c('Action').t`Compare all plans`}
            <IcChevronRight className="shrink-0 ml-1" />
        </Button>
    );
};

export default DashboardComparePlansCTA;
