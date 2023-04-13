import { ADDON_NAMES, PLANS } from '../constants';
import { Organization, Plan, PlanIDs } from '../interfaces';

const { MAIL, DRIVE, PASS_PLUS, VPN, FAMILY, NEW_VISIONARY, ENTERPRISE, BUNDLE, BUNDLE_PRO, MAIL_PRO, DRIVE_PRO } =
    PLANS;
const NEW_PLANS = [
    MAIL,
    DRIVE,
    PASS_PLUS,
    VPN,
    FAMILY,
    NEW_VISIONARY,
    ENTERPRISE,
    BUNDLE,
    BUNDLE_PRO,
    MAIL_PRO,
    DRIVE_PRO,
];

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

export const switchPlan = ({
    planIDs,
    planID,
    organization,
    plans,
}: {
    planIDs: PlanIDs;
    planID?: PLANS | ADDON_NAMES;
    organization?: Organization;
    plans: Plan[];
}) => {
    if (planID === undefined) {
        return {};
    }

    if (NEW_PLANS.includes(planID as PLANS)) {
        const newPlanIDs = { [planID]: 1 };
        const supportedAddons = getSupportedAddons(newPlanIDs);

        // Transfer addons
        Object.keys(supportedAddons).forEach((addon) => {
            const quantity = planIDs[addon as keyof PlanIDs];

            if (quantity) {
                newPlanIDs[addon] = quantity;
            }

            const plan = plans.find(({ Name }) => Name === planID);

            // Transfer member addons
            if (addon.startsWith('1member') && plan && organization) {
                const memberAddon = plans.find(({ Name }) => Name === addon);
                const diffAddresses = (organization.UsedAddresses || 0) - plan.MaxAddresses;
                const diffSpace =
                    ((organization.UsedMembers > 1 ? organization.AssignedSpace : organization.UsedSpace) || 0) -
                    plan.MaxSpace; // AssignedSpace is the space assigned to members in the organization which count for addon transfer
                const diffVPN = (organization.UsedVPN || 0) - plan.MaxVPN;
                const diffMembers = (organization.UsedMembers || 0) - plan.MaxMembers;
                const diffCalendars = (organization.UsedCalendars || 0) - plan.MaxCalendars;

                if (memberAddon) {
                    newPlanIDs[addon] = Math.max(
                        diffSpace > 0 && memberAddon.MaxSpace ? Math.ceil(diffSpace / memberAddon.MaxSpace) : 0,
                        diffAddresses > 0 && memberAddon.MaxAddresses
                            ? Math.ceil(diffAddresses / memberAddon.MaxAddresses)
                            : 0,
                        diffVPN > 0 && memberAddon.MaxVPN ? Math.ceil(diffVPN / memberAddon.MaxVPN) : 0,
                        diffMembers > 0 && memberAddon.MaxMembers ? Math.ceil(diffMembers / memberAddon.MaxMembers) : 0,
                        diffCalendars > 0 && memberAddon.MaxCalendars
                            ? Math.ceil(diffCalendars / memberAddon.MaxCalendars)
                            : 0,
                        (planIDs[ADDON_NAMES.MEMBER_BUNDLE_PRO] || 0) +
                            (planIDs[ADDON_NAMES.MEMBER_DRIVE_PRO] || 0) +
                            (planIDs[ADDON_NAMES.MEMBER_MAIL_PRO] || 0) +
                            (planIDs[ADDON_NAMES.MEMBER_ENTERPRISE] || 0)
                    );
                }
            }

            // Transfer domain addons
            if (addon.startsWith('1domain') && plan && organization) {
                const domainAddon = plans.find(({ Name }) => Name === addon);
                const diffDomains = (organization.UsedDomains || 0) - plan.MaxDomains;

                if (domainAddon) {
                    newPlanIDs[addon] = Math.max(
                        diffDomains > 0 && domainAddon.MaxDomains ? Math.ceil(diffDomains / domainAddon.MaxDomains) : 0,
                        (planIDs[ADDON_NAMES.DOMAIN_ENTERPRISE] || 0) + (planIDs[ADDON_NAMES.DOMAIN_BUNDLE_PRO] || 0)
                    );
                }
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
