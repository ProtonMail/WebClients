import { type PlanIDs, getPlanNameFromIDs, getPlansWithAddons } from '@proton/payments';

export const getHasPlanCustomizer = (planIDs: PlanIDs) => {
    const planName = getPlanNameFromIDs(planIDs);
    if (!planName) {
        return false;
    }

    return getPlansWithAddons().includes(planName);
};

export type DecreaseBlockedReason = 'forbidden-modification';

export type IncreaseBlockedReason = 'trial-limit';
