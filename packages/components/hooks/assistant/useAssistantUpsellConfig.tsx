import { useOrganization, useSubscription, useUser } from '@proton/components/hooks';
import { getPlan } from '@proton/shared/lib/helpers/subscription';

import { getAssistantDowngradeConfig, getAssistantUpsellConfig } from './assistantUpsellConfig';

interface Props {
    upsellRef: string;
    downgradeRef?: string;
}

const useAssistantUpsellConfig = ({ upsellRef, downgradeRef }: Props) => {
    const [user] = useUser();
    const [subscription] = useSubscription();
    const [organization] = useOrganization();
    const currentPlan = getPlan(subscription);
    const isOrgAdmin = user.isAdmin;

    const assistantUpsellConfig = getAssistantUpsellConfig(
        upsellRef,
        user,
        isOrgAdmin,
        currentPlan,
        subscription,
        organization
    );

    let assistantDowngradeConfig = undefined;
    if (downgradeRef) {
        assistantDowngradeConfig = getAssistantDowngradeConfig(downgradeRef, currentPlan);
    }

    return {
        assistantUpsellConfig,
        assistantDowngradeConfig,
    };
};

export default useAssistantUpsellConfig;
