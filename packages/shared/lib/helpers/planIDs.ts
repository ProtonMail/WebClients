import { Plan, PlanIDs } from '../interfaces';
import { PLANS, ADDON_NAMES } from '../constants';

const { MAIL, DRIVE, VPN, FAMILY, NEW_VISIONARY, ENTERPRISE, BUNDLE, BUNDLE_PRO, MAIL_PRO, DRIVE_PRO } = PLANS;
const NEW_PLANS = [MAIL, DRIVE, VPN, FAMILY, NEW_VISIONARY, ENTERPRISE, BUNDLE, BUNDLE_PRO, MAIL_PRO, DRIVE_PRO];

export const hasPlanIDs = (planIDs: PlanIDs) => Object.values(planIDs).some((quantity) => quantity > 0);

export const clearPlanIDs = (planIDs: PlanIDs) => {
    return Object.entries(planIDs).reduce<PlanIDs>((acc, [planName, quantity = 0]) => {
        if (quantity <= 0) {
            return acc;
        }
        acc[planName as keyof PlanIDs] = quantity;
        return acc;
    }, {});
};

export const getHasPlanType = (planIDs: PlanIDs, plans: Plan[], planType: PLANS) => {
    const plan = plans.find(({ Name }) => Name === planType);
    return plan?.Name ? (planIDs?.[plan.Name] || 0) >= 1 : false;
};

export const getSupportedAddons = (planIDs: PlanIDs) => {
    const supported: Partial<Record<ADDON_NAMES, boolean>> = {};

    if (planIDs[MAIL_PRO]) {
        supported[ADDON_NAMES.MEMBER_MAIL_PRO] = true;
    }

    if (planIDs[DRIVE_PRO]) {
        supported[ADDON_NAMES.MEMBER_DRIVE_PRO] = true;
    }

    if (planIDs[BUNDLE_PRO]) {
        supported[ADDON_NAMES.MEMBER_BUNDLE_PRO] = true;
        supported[ADDON_NAMES.DOMAIN_BUNDLE_PRO] = true;
    }

    if (planIDs[ENTERPRISE]) {
        supported[ADDON_NAMES.MEMBER_ENTERPRISE] = true;
        supported[ADDON_NAMES.DOMAIN_ENTERPRISE] = true;
    }

    return supported;
};

export const switchPlan = ({ planIDs, planID }: { planIDs: PlanIDs; planID?: PLANS | ADDON_NAMES }) => {
    if (planID === undefined) {
        return {};
    }

    if (NEW_PLANS.includes(planID as PLANS)) {
        const newPlanIDs = { [planID]: 1 };
        const supportedAddons = getSupportedAddons(newPlanIDs);

        // Transfer addons
        Object.keys(supportedAddons).forEach((addon) => {
            const quantity = planIDs[addon as keyof PlanIDs];

            // Transfer domain addons
            if (quantity) {
                newPlanIDs[addon] = quantity;
            }

            // Transfer member addons
            if (addon.startsWith('1member')) {
                newPlanIDs[addon] =
                    (planIDs[ADDON_NAMES.MEMBER] || 0) +
                    (planIDs[ADDON_NAMES.MEMBER_BUNDLE_PRO] || 0) +
                    (planIDs[ADDON_NAMES.MEMBER_DRIVE_PRO] || 0) +
                    (planIDs[ADDON_NAMES.MEMBER_MAIL_PRO] || 0) +
                    (planIDs[ADDON_NAMES.MEMBER_ENTERPRISE] || 0);
            }

            if (addon.startsWith('1domain')) {
                newPlanIDs[addon] =
                    (planIDs[ADDON_NAMES.DOMAIN] || 0) +
                    (planIDs[ADDON_NAMES.DOMAIN_ENTERPRISE] || 0) +
                    (planIDs[ADDON_NAMES.DOMAIN_BUNDLE_PRO] || 0);
            }
        });

        return clearPlanIDs(newPlanIDs);
    }

    return {};
};

export const setQuantity = (planIDs: PlanIDs, planID: PLANS | ADDON_NAMES, newQuantity: number) => {
    const { [planID]: removedPlan, ...restPlanIDs } = planIDs;
    if (!newQuantity || newQuantity <= 0) {
        return restPlanIDs;
    }
    return {
        ...restPlanIDs,
        [planID]: newQuantity,
    };
};

export const supportAddons = (planIDs: PlanIDs) => {
    const supportedAddons = getSupportedAddons(planIDs);
    return !!Object.keys(supportedAddons).length;
};
