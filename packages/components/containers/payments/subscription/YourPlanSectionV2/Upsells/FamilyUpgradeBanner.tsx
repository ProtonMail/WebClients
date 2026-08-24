import { c } from 'ttag';

import { Button } from '@proton/atoms/Button/Button';
import { PLANS, PLAN_NAMES } from '@proton/payments/core/constants';
import type { Subscription } from '@proton/payments/core/subscription/interface';
import { FAMILY_MAX_USERS } from '@proton/shared/lib/constants';

import { getSimplePriceString } from '../../../../../components/price/helper';
import useDashboardPaymentFlow from '../../../../../hooks/useDashboardPaymentFlow';
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
    const [openSubscriptionModal, loadingSubscriptionModal] = useSubscriptionModal();
    const telemetryFlow = useDashboardPaymentFlow(app);
    const { cheapestMonthlyPrice } = useSubscriptionPriceComparison(app, subscription, plan);

    const handleGetPlan = () => {
        void openSubscriptionModal({
            step: SUBSCRIPTION_STEPS.CHECKOUT,
            plan: plan,
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
                    <Button color="norm" shape="outline" loading={loadingSubscriptionModal} onClick={handleGetPlan}>
                        {c('Action').t`Upgrade`}
                    </Button>
                </>
            }
            style="card"
        />
    );
};

export default FamilyUpgradeBanner;
