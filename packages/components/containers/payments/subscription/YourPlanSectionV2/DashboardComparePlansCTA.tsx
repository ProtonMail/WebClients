import { c } from 'ttag';

import { useSubscription } from '@proton/account/subscription/hooks';
import { Button } from '@proton/atoms/Button/Button';
import useDashboardPaymentFlow from '@proton/components/hooks/useDashboardPaymentFlow';
import { IcChevronRight } from '@proton/icons/icons/IcChevronRight';
import { getAudienceFromSubscription } from '@proton/payments/core/subscription/helpers';
import type { APP_NAMES } from '@proton/shared/lib/constants';

import { useSubscriptionModal } from '../SubscriptionModalProvider';
import { SUBSCRIPTION_STEPS } from '../constants';

interface Props {
    app: APP_NAMES;
}
const DashboardComparePlansCTA = ({ app }: Props) => {
    const [subscription] = useSubscription();
    const [openSubscriptionModal] = useSubscriptionModal();
    const telemetryFlow = useDashboardPaymentFlow(app);

    const handleExplorePlans = () => {
        openSubscriptionModal({
            step: SUBSCRIPTION_STEPS.PLAN_SELECTION,
            metrics: { source: 'upsells' },
            defaultAudience: getAudienceFromSubscription(subscription),
            telemetryFlow,
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
