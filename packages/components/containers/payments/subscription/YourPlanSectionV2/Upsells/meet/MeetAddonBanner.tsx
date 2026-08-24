import { c } from 'ttag';

import { usePlans } from '@proton/account/plans/hooks';
import { useSubscription } from '@proton/account/subscription/hooks';
import { Button } from '@proton/atoms/Button/Button';
import { DashboardGrid } from '@proton/atoms/DashboardGrid/DashboardGrid';
import { ADDON_PREFIXES, PLANS, PLAN_NAMES } from '@proton/payments/core/constants';
import { hasAddonFromPlanIDs } from '@proton/payments/core/plan/addons';
import { getAddonNameByPlan } from '@proton/payments/core/plan/helpers';
import { getHasMeetIncludedInPlan, getPlanIDs, getPlanName } from '@proton/payments/core/subscription/helpers';
import { getPlansMap } from '@proton/payments/core/subscription/plans-map-wrapper';
import { SelectedPlan } from '@proton/payments/core/subscription/selected-plan';

import NewBadge from '../../../../../../components/newBadge/NewBadge';
import { getSimplePriceString } from '../../../../../../components/price/helper';
import useDashboardPaymentFlow from '../../../../../../hooks/useDashboardPaymentFlow';
import { useCurrencies } from '../../../../../../payments/client-extensions/useCurrencies';
import { useSubscriptionModal } from '../../../SubscriptionModalProvider';
import { SUBSCRIPTION_STEPS } from '../../../constants';
import { PlanIcon } from '../../PlanIcon';
import PlanIconName from '../../PlanIconName';
import type { UpsellSectionBaseProps } from '../../YourPlanUpsellsSectionV2';
import UpsellMultiBox from '../UpsellMultiBox';

const MeetAddonBanner = ({ app }: UpsellSectionBaseProps) => {
    const [openSubscriptionModal, loadingSubscriptionModal] = useSubscriptionModal();
    const telemetryFlow = useDashboardPaymentFlow(app);
    const [subscription] = useSubscription();
    const [plansResult] = usePlans();
    const { getPreferredCurrency } = useCurrencies();

    const plans = plansResult?.plans ?? [];
    const preferredCurrency = subscription ? getPreferredCurrency({ subscription, plans }) : undefined;
    const plansMap = preferredCurrency ? getPlansMap(plans, preferredCurrency, true) : undefined;

    const currentPlanName = subscription ? getPlanName(subscription) : undefined;
    const meetAddonName = currentPlanName ? getAddonNameByPlan(ADDON_PREFIXES.MEET, currentPlanName) : undefined;
    const meetAddon = meetAddonName && plansMap ? plansMap[meetAddonName] : undefined;
    const cycle = subscription?.Cycle;
    const monthlyPrice = meetAddon && cycle ? (meetAddon.Pricing[cycle] ?? 0) / cycle : 0;
    const priceString = preferredCurrency ? getSimplePriceString(preferredCurrency, monthlyPrice) : '';

    const hasMeetAddon = hasAddonFromPlanIDs(ADDON_PREFIXES.MEET, getPlanIDs(subscription));

    const handleGetPlan = () => {
        if (!subscription || !plansMap) {
            return;
        }

        const selectedPlan = SelectedPlan.createFromSubscription(subscription, plansMap);

        void openSubscriptionModal({
            step: SUBSCRIPTION_STEPS.CHECKOUT,
            disablePlanSelection: true,
            disableCycleSelector: true,
            planIDs: selectedPlan.setMeetCount(selectedPlan.getTotalUsers()).planIDs,
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
                    <Button color="norm" shape="outline" loading={loadingSubscriptionModal} onClick={handleGetPlan}>
                        {c('Meet_launch').t`Add ${planName}`}
                    </Button>
                }
                style="card"
            />
        </DashboardGrid>
    );
};

export default MeetAddonBanner;
