import { c } from 'ttag';

import { Button } from '@proton/atoms';
import { getSimplePriceString } from '@proton/components/components/price/helper';
import useDashboardPaymentFlow from '@proton/components/hooks/useDashboardPaymentFlow';
import { PLANS, PLAN_NAMES, type Subscription } from '@proton/payments';

import { useSubscriptionModal } from '../../SubscriptionModalProvider';
import { SUBSCRIPTION_STEPS } from '../../constants';
import { PlanIcon } from '../PlanIcon';
import PlanIconName from '../PlanIconName';
import type { UpsellSectionBaseProps } from '../YourPlanUpsellsSectionV2';
import UpsellMultiBox from './UpsellMultiBox';
import { useSubscriptionPriceComparison } from './helper';

interface Props extends UpsellSectionBaseProps {
    subscription: Subscription;
}

const DuoBanner = ({ app, subscription }: Props) => {
    const plan = PLANS.DUO;
    const [openSubscriptionModal] = useSubscriptionModal();
    const { cheapestMonthlyPrice } = useSubscriptionPriceComparison(subscription, plan);
    const telemetryFlow = useDashboardPaymentFlow(app);

    const handleGetPlan = () => {
        openSubscriptionModal({
            step: SUBSCRIPTION_STEPS.CHECKOUT,
            plan: plan,
            metrics: { source: 'upsells' },
            telemetryFlow,
        });
    };

    const priceString = getSimplePriceString(subscription.Currency, cheapestMonthlyPrice);

    return (
        <UpsellMultiBox
            header={
                <PlanIconName
                    logo={<PlanIcon planName={plan} />}
                    topLine={PLAN_NAMES[plan]}
                    bottomLine={c('Upsell')
                        .t`Unlimited privacy for you and a loved one. From only ${priceString}/month.`}
                />
            }
            headerActionArea={
                <Button color="norm" shape="outline" onClick={handleGetPlan}>
                    {c('Action').t`Upgrade`}
                </Button>
            }
            style="card"
        />
    );
};

export default DuoBanner;
