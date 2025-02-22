import type { OpenCallbackProps } from '@proton/components/containers/payments/subscription/SubscriptionModalProvider';
import { SUBSCRIPTION_STEPS } from '@proton/components/containers/payments/subscription/constants';
import type { SelectedPlan } from '@proton/payments';
import { CYCLE, type PlanIDs, getScribeAddonNameByPlan, isScribeAddon, removeAddon } from '@proton/payments';
import type { UserModel } from '@proton/shared/lib/interfaces';

const getUpgradeCycles = (currentCycle = CYCLE.MONTHLY) => ({
    cycle: currentCycle,
    minimumCycle: currentCycle,
    maximumCycle: currentCycle === CYCLE.MONTHLY ? CYCLE.YEARLY : currentCycle,
});

export const getAssistantUpsellConfig = (
    user: UserModel,
    isOrgAdmin: boolean,
    selectedPlan: SelectedPlan
): Pick<OpenCallbackProps, 'planIDs' | 'cycle' | 'minimumCycle' | 'maximumCycle'> | undefined => {
    const cycles = getUpgradeCycles(selectedPlan.cycle);

    if (!user.isSelf) {
        return undefined;
    }

    if (isOrgAdmin) {
        const addonName = getScribeAddonNameByPlan(selectedPlan.name);
        // if we already have scribe addons, then we will use the current number of scribes as starting addon number
        // in the upsell
        // if we don't, then we will use the number of members as starting number for scribe addons
        const addonsValue = selectedPlan.getTotalScribes() || selectedPlan.getTotalUsers();

        const planIDs: PlanIDs = {
            ...selectedPlan.planIDs,
        };

        if (addonName) {
            planIDs[addonName] = addonsValue;
        }

        return {
            planIDs,
            ...cycles,
        };
    }

    if (user.isPaid) {
        const addonName = getScribeAddonNameByPlan(selectedPlan.name);
        const planIDs: PlanIDs = {
            [selectedPlan.name]: 1,
        };

        if (addonName) {
            planIDs[addonName] = 1;
        }

        return {
            planIDs,
            ...cycles,
        };
    }

    return undefined;
};

// TODO: Remove as it's unused
export const getAssistantDowngradeConfig = (
    upsellRef: string,
    selectedPlan: SelectedPlan
): OpenCallbackProps | undefined => {
    return {
        mode: 'upsell-modal',
        /**
         * Removes only Scribe addons and keep all others
         */
        planIDs: removeAddon(selectedPlan.planIDs, isScribeAddon),
        step: SUBSCRIPTION_STEPS.CHECKOUT,
        disablePlanSelection: true,
        cycle: selectedPlan.cycle,
        maximumCycle: selectedPlan.cycle,
        minimumCycle: selectedPlan.cycle,
        upsellRef,
        metrics: {
            source: 'upsells',
        },
    };
};
