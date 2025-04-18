import { useSubscription } from '@proton/account/subscription/hooks';
import { useUser } from '@proton/account/user/hooks';
import { type Plan, SelectedPlan } from '@proton/payments';

import { getAssistantDowngradeConfig, getAssistantUpsellConfig } from './assistantUpsellConfig';

interface Props {
    upsellRef: string;
    downgradeRef?: string;
    plans: Plan[];
}

const useAssistantUpsellConfig = ({ upsellRef, downgradeRef, plans }: Props) => {
    const [user] = useUser();
    const [subscription] = useSubscription();
    const latestSubscription = subscription?.UpcomingSubscription ?? subscription;
    const isOrgAdmin = user.isAdmin;

    const selectedPlan = SelectedPlan.createFromSubscription(latestSubscription, plans);

    const assistantUpsellConfig = getAssistantUpsellConfig(upsellRef, user, isOrgAdmin, selectedPlan);

    let assistantDowngradeConfig = undefined;
    if (downgradeRef) {
        assistantDowngradeConfig = getAssistantDowngradeConfig(downgradeRef, selectedPlan);
    }

    return {
        assistantUpsellConfig,
        assistantDowngradeConfig,
    };
};

export default useAssistantUpsellConfig;
