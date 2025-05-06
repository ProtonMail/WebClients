import type { OpenCallbackProps } from '@proton/components/containers/payments/subscription/SubscriptionModalProvider';
import { CYCLE, type SelectedPlan } from '@proton/payments';
import type { UserModel } from '@proton/shared/lib/interfaces';

const getUpgradeCycles = (currentCycle = CYCLE.MONTHLY) => ({
    cycle: currentCycle,
    minimumCycle: currentCycle,
    maximumCycle: currentCycle === CYCLE.MONTHLY ? CYCLE.YEARLY : currentCycle,
});

export const getAssistantUpsellConfigPlanAndCycle = (
    user: UserModel,
    isOrgAdmin: boolean,
    selectedPlan: SelectedPlan
): Pick<OpenCallbackProps, 'planIDs' | 'cycle' | 'minimumCycle' | 'maximumCycle'> | undefined => {
    const cycles = getUpgradeCycles(selectedPlan.cycle);

    if (!user.isSelf) {
        return undefined;
    }

    if (isOrgAdmin) {
        // if we already have scribe addons, then we will use the current number of scribes as starting addon number
        // in the upsell
        // if we don't, then we will use the number of members as starting number for scribe addons
        const addonsValue = selectedPlan.getTotalScribes() || selectedPlan.getTotalUsers();

        // Update the selected plan with the new scribe count
        const updatedSelectedPlan = selectedPlan.setScribeCount(addonsValue);

        return {
            planIDs: updatedSelectedPlan.planIDs,
            ...cycles,
        };
    }

    if (user.isPaid) {
        const updatedSelectedPlan = selectedPlan.setScribeCount(1);

        return {
            planIDs: updatedSelectedPlan.planIDs,
            ...cycles,
        };
    }

    return undefined;
};
