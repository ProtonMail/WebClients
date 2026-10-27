import { useSubscription } from '@proton/account/subscription/hooks';
import { useUser } from '@proton/account/user/hooks';
import { SelectedPlan } from '@proton/payments/core/subscription/selected-plan';
import { SUBSCRIPTION_STEPS } from '@proton/payments/core/subscription/subscription-modal-constants';
import type { Plan } from '@proton/shared/lib/payments/plan/interface';
import { useFlag } from '@proton/unleash/useFlag';

import type { OpenCallbackProps } from '../../containers/payments/subscription/SubscriptionModalProvider';
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
