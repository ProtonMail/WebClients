import { useSubscription } from '@proton/account/subscription/hooks';
import { useUser } from '@proton/account/user/hooks';
import type { OpenCallbackProps } from '@proton/components/containers/payments/subscription/SubscriptionModalProvider';
import { SUBSCRIPTION_STEPS } from '@proton/components/containers/payments/subscription/constants';
import { type Plan, SelectedPlan } from '@proton/payments';

import { getAssistantUpsellConfigPlanAndCycle } from './assistantUpsellConfig';

interface Props {
    upsellRef: string;
    downgradeRef?: string;
    plans: Plan[];
}

const useAssistantUpsellConfig = ({ upsellRef, plans }: Props) => {
    const [user] = useUser();
    const [subscription] = useSubscription();
    const latestSubscription = subscription?.UpcomingSubscription ?? subscription;
    const isOrgAdmin = user.isAdmin;

    const selectedPlan = SelectedPlan.createFromSubscription(latestSubscription, plans);

    const assistantUpsellConfig: OpenCallbackProps = {
        ...getAssistantUpsellConfigPlanAndCycle(user, isOrgAdmin, selectedPlan),
        upsellRef,
        cycle: selectedPlan.cycle,
        planIDs: selectedPlan.planIDs,
        mode: 'upsell-modal',
        step: SUBSCRIPTION_STEPS.CHECKOUT,
        disablePlanSelection: true,
        metrics: {
            source: 'upsells',
        },
    };

    return { assistantUpsellConfig };
};

export default useAssistantUpsellConfig;
