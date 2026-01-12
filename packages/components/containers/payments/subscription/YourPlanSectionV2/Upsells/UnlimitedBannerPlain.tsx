import { c } from 'ttag';

import { Button } from '@proton/atoms/Button/Button';
import { getSimplePriceString } from '@proton/components/components/price/helper';
import getBoldFormattedText from '@proton/components/helpers/getBoldFormattedText';
import useDashboardPaymentFlow from '@proton/components/hooks/useDashboardPaymentFlow';
import { PLANS, PLAN_NAMES, type Subscription } from '@proton/payments';
import { VPN_SHORT_APP_NAME } from '@proton/shared/lib/constants';

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

const UnlimitedBannerPlain = ({ app, subscription }: Props) => {
    const [openSubscriptionModal] = useSubscriptionModal();
    const telemetryFlow = useDashboardPaymentFlow(app);

    const plan = PLANS.BUNDLE;
    const { priceDifference, priceFallbackPerMonth, showPriceDifference } = useSubscriptionPriceComparison(
        app,
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
                                      .t`Privacy suite with secure email, ${VPN_SHORT_APP_NAME}, cloud storage, and password manager in one bundle. Only **${priceString}** more each month.`,
                                  'color-primary'
                              )
                            : c('Upsell')
                                  .t`Privacy suite with secure email, ${VPN_SHORT_APP_NAME}, cloud storage, and password manager in one bundle. From only ${fallBackString} per month`
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
