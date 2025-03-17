import { c } from 'ttag';

import { Button } from '@proton/atoms';
import { getSimplePriceString } from '@proton/components/components/price/helper';
import useDashboardPaymentFlow from '@proton/components/hooks/useDashboardPaymentFlow';
import { PLANS, PLAN_NAMES } from '@proton/payments';
import { FAMILY_MAX_USERS } from '@proton/shared/lib/constants';
import { Audience } from '@proton/shared/lib/interfaces';

import { useSubscriptionModal } from '../../SubscriptionModalProvider';
import { SUBSCRIPTION_STEPS } from '../../constants';
import { PlanIcon } from '../PlanIcon';
import PlanIconName from '../PlanIconName';
import type { UpsellSectionBaseProps } from '../YourPlanUpsellsSectionV2';
import UpsellMultiBox from './UpsellMultiBox';
import { useSubscriptionPriceComparison } from './helper';

const ExploreGroupPlansBanner = ({ subscription, app }: UpsellSectionBaseProps) => {
    const [openSubscriptionModal] = useSubscriptionModal();
    const { cheapestMonthlyPrice } = useSubscriptionPriceComparison(subscription, PLANS.FAMILY);
    const telemetryFlow = useDashboardPaymentFlow(app);

    const pricePerMonthPerUser = cheapestMonthlyPrice ? cheapestMonthlyPrice / FAMILY_MAX_USERS : undefined;

    const handleExplorePlans = () => {
        openSubscriptionModal({
            step: SUBSCRIPTION_STEPS.PLAN_SELECTION,
            metrics: { source: 'plans' },
            defaultAudience: Audience.FAMILY,
            telemetryFlow,
        });
    };

    const priceString = pricePerMonthPerUser
        ? getSimplePriceString(subscription.Currency, pricePerMonthPerUser)
        : undefined;

    return (
        <UpsellMultiBox
            header={
                <PlanIconName
                    logo={<PlanIcon planName={PLANS.DUO} />}
                    topLine={c('Upsell').t`Did you know?`}
                    bottomLine={
                        pricePerMonthPerUser &&
                        c('Upsell')
                            .t`You can protect up to ${FAMILY_MAX_USERS} people with ${PLAN_NAMES[PLANS.DUO]} or ${PLAN_NAMES[PLANS.FAMILY]}. Starting from just ${priceString}/month per account.`
                    }
                />
            }
            headerActionArea={
                <>
                    <Button color="norm" shape="outline" onClick={handleExplorePlans}>
                        {c('Action').t`Explore group plans`}
                    </Button>
                </>
            }
            style="card"
        />
    );
};

export default ExploreGroupPlansBanner;
