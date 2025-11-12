import { c } from 'ttag';

import { Button } from '@proton/atoms/Button/Button';
import { getSimplePriceString } from '@proton/components/components/price/helper';
import useDashboardPaymentFlow from '@proton/components/hooks/useDashboardPaymentFlow';
import { PLANS, PLAN_NAMES, type Subscription } from '@proton/payments';
import { FAMILY_MAX_USERS } from '@proton/shared/lib/constants';

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

const FamilyUpgradeBanner = ({ app, subscription }: Props) => {
    const plan = PLANS.FAMILY;
    const [openSubscriptionModal] = useSubscriptionModal();
    const { cheapestMonthlyPrice } = useSubscriptionPriceComparison(app, subscription, plan);
    const telemetryFlow = useDashboardPaymentFlow(app);

    const handleGetPlan = () => {
        openSubscriptionModal({
            step: SUBSCRIPTION_STEPS.CHECKOUT,
            plan: plan,
            metrics: { source: 'upsells' },
            telemetryFlow,
        });
    };

    const priceString = cheapestMonthlyPrice
        ? getSimplePriceString(subscription.Currency, cheapestMonthlyPrice)
        : undefined;

    return (
        <UpsellMultiBox
            header={
                <PlanIconName
                    logo={<PlanIcon planName={plan} />}
                    topLine={PLAN_NAMES[plan]}
                    bottomLine={
                        cheapestMonthlyPrice &&
                        c('Upsell')
                            .t`Unlimited privacy for up to ${FAMILY_MAX_USERS} people. From only ${priceString}/month.`
                    }
                />
            }
            headerActionArea={
                <>
                    <Button color="norm" shape="outline" onClick={handleGetPlan}>
                        {c('Action').t`Upgrade`}
                    </Button>
                </>
            }
            style="card"
        />
    );
};

export default FamilyUpgradeBanner;
