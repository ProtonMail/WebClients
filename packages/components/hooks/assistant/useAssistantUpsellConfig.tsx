import { useSubscription } from '@proton/account/subscription/hooks';
import { useUser } from '@proton/account/user/hooks';
import type { Plan } from '@proton/payments/core/plan/interface';
import { SelectedPlan } from '@proton/payments/core/subscription/selected-plan';
import { useFlag } from '@proton/unleash/useFlag';

import type { OpenCallbackProps } from '../../containers/payments/subscription/SubscriptionModalProvider';
import { SUBSCRIPTION_STEPS } from '../../containers/payments/subscription/constants';
import { getAssistantUpsellConfigPlanAndCycle } from './assistantUpsellConfig';

interface Props {
    upsellRef: string;
    downgradeRef?: string;
    plans: Plan[];
}

const useAssistantUpsellConfig = ({ upsellRef, plans }: Props) => {
    const [user] = useUser();
    const [subscription] = useSubscription();
    const scribeToLumo = useFlag('ScribeToLumo');
    const latestSubscription = subscription?.UpcomingSubscription ?? subscription;
    const isOrgAdmin = user.isAdmin;

    const selectedPlan = SelectedPlan.createFromSubscription(latestSubscription, plans);

    const assistantUpsellConfig: OpenCallbackProps = {
        ...getAssistantUpsellConfigPlanAndCycle(user, isOrgAdmin, selectedPlan, scribeToLumo),
        upsellRef,
        cycle: selectedPlan.cycle,
        planIDs: selectedPlan.planIDs,
        mode: 'upsell-modal',
        step: SUBSCRIPTION_STEPS.CHECKOUT,
        disablePlanSelection: true,
    };

    return { assistantUpsellConfig };
};

export default useAssistantUpsellConfig;
