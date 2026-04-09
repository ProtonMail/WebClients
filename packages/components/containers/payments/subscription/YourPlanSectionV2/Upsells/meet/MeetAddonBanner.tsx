import { c } from 'ttag';

import { usePlans } from '@proton/account/plans/hooks';
import { useSubscription } from '@proton/account/subscription/hooks';
import { Button } from '@proton/atoms/Button/Button';
import { DashboardGrid } from '@proton/atoms/DashboardGrid/DashboardGrid';
import NewBadge from '@proton/components/components/newBadge/NewBadge';
import { getSimplePriceString } from '@proton/components/components/price/helper';
import useDashboardPaymentFlow from '@proton/components/hooks/useDashboardPaymentFlow';
import { useCurrencies } from '@proton/components/payments/client-extensions/useCurrencies';
import {
    PLANS,
    PLAN_NAMES,
    SelectedPlan,
    getMeetAddonNameByPlan,
    getPlanIDs,
    getPlanName,
    getPlansMap,
    hasMeetAddonFromPlanIDs,
} from '@proton/payments';
import { getHasMeetIncludedInPlan } from '@proton/payments/core/subscription/helpers';

import { useSubscriptionModal } from '../../../SubscriptionModalProvider';
import { SUBSCRIPTION_STEPS } from '../../../constants';
import { PlanIcon } from '../../PlanIcon';
import PlanIconName from '../../PlanIconName';
import type { UpsellSectionBaseProps } from '../../YourPlanUpsellsSectionV2';
import UpsellMultiBox from '../UpsellMultiBox';

const MeetAddonBanner = ({ app }: UpsellSectionBaseProps) => {
    const [openSubscriptionModal] = useSubscriptionModal();
    const telemetryFlow = useDashboardPaymentFlow(app);
    const [subscription] = useSubscription();
    const [plansResult] = usePlans();
    const { getPreferredCurrency } = useCurrencies();

    const plans = plansResult?.plans ?? [];
    const preferredCurrency = subscription ? getPreferredCurrency({ subscription, plans }) : undefined;
    const plansMap = preferredCurrency ? getPlansMap(plans, preferredCurrency, true) : undefined;

    const currentPlanName = subscription ? getPlanName(subscription) : undefined;
    const meetAddonName = currentPlanName ? getMeetAddonNameByPlan(currentPlanName) : undefined;
    const meetAddon = meetAddonName && plansMap ? plansMap[meetAddonName] : undefined;
    const cycle = subscription?.Cycle;
    const monthlyPrice = meetAddon && cycle ? (meetAddon.Pricing[cycle] ?? 0) / cycle : 0;
    const priceString = preferredCurrency ? getSimplePriceString(preferredCurrency, monthlyPrice) : '';

    const hasMeetAddon = hasMeetAddonFromPlanIDs(getPlanIDs(subscription));

    const handleGetPlan = () => {
        if (!subscription || !plansMap) {
            return;
        }

        const selectedPlan = SelectedPlan.createFromSubscription(subscription, plansMap);

        openSubscriptionModal({
            step: SUBSCRIPTION_STEPS.CHECKOUT,
            disablePlanSelection: true,
            disableCycleSelector: true,
            planIDs: selectedPlan.setMeetCount(selectedPlan.getTotalUsers()).planIDs,
            metrics: { source: 'upsells' },
            telemetryFlow,
        });
    };

    if (!meetAddon || hasMeetAddon || getHasMeetIncludedInPlan(subscription)) {
        return null;
    }

    const plan = PLANS.MEET_BUSINESS;
    const planName = PLAN_NAMES[plan];

    return (
        <DashboardGrid>
            <UpsellMultiBox
                header={
                    <PlanIconName
                        logo={<PlanIcon planName={plan} />}
                        topLine={
                            <>
                                {c('Meet_launch').t`Talk privately with ${planName}`}{' '}
                                <span className="inline-flex">
                                    <NewBadge className="px-1" />
                                </span>
                            </>
                        }
                        bottomLine={c('Meet_launch')
                            .t`Confidential video conferencing for the conversations that matter. Only ${priceString} more each month.`}
                    />
                }
                headerActionArea={
                    <Button color="norm" shape="outline" onClick={handleGetPlan}>
                        {c('Meet_launch').t`Add ${planName}`}
                    </Button>
                }
                style="card"
            />
        </DashboardGrid>
    );
};

export default MeetAddonBanner;
