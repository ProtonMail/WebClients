import { c } from 'ttag';

import { Button } from '@proton/atoms';
import { getSimplePriceString } from '@proton/components/components/price/helper';
import getBoldFormattedText from '@proton/components/helpers/getBoldFormattedText';
import useDashboardPaymentFlow from '@proton/components/hooks/useDashboardPaymentFlow';
import { PLANS, PLAN_NAMES } from '@proton/payments';
import { BRAND_NAME } from '@proton/shared/lib/constants';

import { useSubscriptionModal } from '../../SubscriptionModalProvider';
import { SUBSCRIPTION_STEPS } from '../../constants';
import { PlanIcon } from '../PlanIcon';
import PlanIconName from '../PlanIconName';
import type { UpsellSectionBaseProps } from '../YourPlanUpsellsSectionV2';
import UpsellMultiBox from './UpsellMultiBox';
import { useSubscriptionPriceComparison } from './helper';

const UnlimitedBannerPlain = ({ app, subscription }: UpsellSectionBaseProps) => {
    const [openSubscriptionModal] = useSubscriptionModal();
    const telemetryFlow = useDashboardPaymentFlow(app);

    const plan = PLANS.BUNDLE;
    const { priceDifference, priceFallbackPerMonth, showPriceDifference } = useSubscriptionPriceComparison(
        subscription,
        plan
    );

    const handleGetPlan = () => {
        openSubscriptionModal({
            step: SUBSCRIPTION_STEPS.PLAN_SELECTION,
            plan: plan,
            metrics: { source: 'upsells' },
            telemetryFlow,
        });
    };

    const priceString = getSimplePriceString(subscription.Currency, priceDifference);
    const fallBackString = getSimplePriceString(subscription.Currency, priceFallbackPerMonth);

    const planName = PLAN_NAMES[plan];

    return (
        <UpsellMultiBox
            header={
                <PlanIconName
                    logo={<PlanIcon planName={plan} />}
                    topLine={planName}
                    bottomLine={
                        showPriceDifference
                            ? getBoldFormattedText(
                                  c('Upsell')
                                      .t`All premium ${BRAND_NAME} services. Only **${priceString}** more each month.`,
                                  'color-primary'
                              )
                            : c('Upsell').t`All premium ${BRAND_NAME} services. From only ${fallBackString} per month`
                    }
                />
            }
            headerActionArea={
                <Button color="norm" shape="outline" onClick={handleGetPlan}>
                    {c('Action').t`Discover ${planName}`}
                </Button>
            }
            style="card"
        />
    );
};

export default UnlimitedBannerPlain;
