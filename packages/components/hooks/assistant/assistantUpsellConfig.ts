import type { OpenCallbackProps } from '@proton/components';
import { SUBSCRIPTION_STEPS } from '@proton/components';
import type { SelectedPlan } from '@proton/payments';
import { getScribeAddonNameByPlan } from '@proton/payments';
import { ADDON_NAMES, CYCLE, PLANS } from '@proton/shared/lib/constants';
import { isScribeAddon, removeAddon } from '@proton/shared/lib/helpers/addons';
import type { PlanIDs, UserModel } from '@proton/shared/lib/interfaces';

const getUpgradeCycles = (currentCycle = CYCLE.MONTHLY) => ({
    cycle: currentCycle,
    minimumCycle: currentCycle,
    maximumCycle: currentCycle === CYCLE.MONTHLY ? CYCLE.YEARLY : currentCycle,
});

// Free users are uspell to Mail Plus with the add-on
const freeUserUpsellConfig = (upsellRef: string): OpenCallbackProps => {
    const cycles = getUpgradeCycles();
    return {
        mode: 'upsell-modal',
        planIDs: { [PLANS.MAIL]: 1, [ADDON_NAMES.MEMBER_SCRIBE_MAILPLUS]: 1 },
        step: SUBSCRIPTION_STEPS.CHECKOUT,
        disablePlanSelection: true,
        upsellRef,
        ...cycles,
        metrics: {
            source: 'upsells',
        },
    };
};

const paidSingleUserUpsellConfig = (
    upsellRef: string,
    planName: PLANS,
    addonName: ADDON_NAMES | undefined,
    cycle?: CYCLE
): OpenCallbackProps => {
    const cycles = getUpgradeCycles(cycle);

    const planIDs: PlanIDs = {
        [planName]: 1,
    };

    if (addonName) {
        planIDs[addonName] = 1;
    }

    return {
        mode: 'upsell-modal',
        planIDs,
        step: SUBSCRIPTION_STEPS.CHECKOUT,
        disablePlanSelection: true,
        upsellRef,
        ...cycles,
        metrics: {
            source: 'upsells',
        },
    };
};

const paidMultipleUserUpsellConfig = (
    upsellRef: string,
    addonName: ADDON_NAMES | undefined,
    selectedPlan: SelectedPlan
): OpenCallbackProps => {
    const cycles = getUpgradeCycles(selectedPlan.cycle);

    // if we already have scribe addons, then we will use the current number of scribes as starting addon number
    // in the upsell
    // if we don't, then we will use the number of members as starting number for scribe addons
    const addonsValue = selectedPlan.getTotalScribes() || selectedPlan.getTotalMembers();

    const planIDs: PlanIDs = {
        ...selectedPlan.planIDs,
    };
    if (addonName) {
        planIDs[addonName] = addonsValue;
    }

    return {
        mode: 'upsell-modal',
        planIDs,
        step: SUBSCRIPTION_STEPS.CHECKOUT,
        disablePlanSelection: true,
        upsellRef,
        ...cycles,
        metrics: {
            source: 'upsells',
        },
    };
};

export const getAssistantUpsellConfig = (
    upsellRef: string,
    user: UserModel,
    isOrgAdmin: boolean,
    selectedPlan: SelectedPlan
): OpenCallbackProps | undefined => {
    if (user.isSubUser) {
        return undefined;
    }

    if (isOrgAdmin) {
        const addonName = getScribeAddonNameByPlan(selectedPlan.name);
        return paidMultipleUserUpsellConfig(upsellRef, addonName, selectedPlan);
    }

    if (user.isPaid) {
        const addonName = getScribeAddonNameByPlan(selectedPlan.name);
        return paidSingleUserUpsellConfig(upsellRef, selectedPlan.name, addonName, selectedPlan.cycle);
    }

    // Return the free user config if the user is not paid and don't have member in its organization
    return freeUserUpsellConfig(upsellRef);
};

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
