import { useSubscription, useUser } from '@proton/components/hooks';
import { SelectedPlan } from '@proton/payments';
import type { Plan } from '@proton/shared/lib/interfaces';

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
