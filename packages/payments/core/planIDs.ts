import type { EitherOr, Organization } from '@proton/shared/lib/interfaces';

import { ALL_ADDON_PREFIXES, getAddonConfigByName, getTransferOrder } from './addon/addons';
import type { AddonTransferStrategy } from './addon/interfaces';
import { ADDON_NAMES, ADDON_PREFIXES, CYCLE, type PLANS } from './constants';
import { getDefaultMainCurrency } from './currencies';
import type { FeatureLimitKey, FreeSubscription, PlanIDs } from './interface';
import { getSupportedAddons, isAddonType } from './plan/addons';
import { getPlanFeatureLimit } from './plan/feature-limits';
import { getPlanNameFromIDs, isMultiUserPersonalPlan } from './plan/helpers';
import type { Plan } from './plan/interface';
import { getSubscriptionsArray, isManagedExternally } from './subscription/helpers/external-management';
import { getPlanIDs } from './subscription/helpers/plan-ids';
import { hasLumo } from './subscription/helpers/plan-matching';
import type { Subscription } from './subscription/interface';
import { SelectedPlan } from './subscription/selected-plan';
import { isFreeSubscription, isValidPlanName } from './type-guards';

export { getPlanFromIDs, hasFreePlanIDs, hasPlanIDs } from './plan/helpers';

const getMeetWithEnoughSeats = ({
    planIDs,
    toPlan,
    plans,
}: {
    planIDs: PlanIDs;
    toPlan: Plan;
    plans: Plan[];
}): number => {
    // Count existing meet addons across all meet addon name variants
    let meetAddons = 0;
    for (const addonName of Object.values(ADDON_NAMES)) {
        if (isAddonType(addonName, ADDON_PREFIXES.MEET)) {
            meetAddons += planIDs[addonName] ?? 0;
        }
    }

    if (meetAddons === 0) {
        return 0;
    }

    // cycle and currency don't matter here, we only care about normalizing the planIDs.
    const currentSelectedPlan = SelectedPlan.createNormalized(planIDs, plans, CYCLE.MONTHLY, getDefaultMainCurrency());
    const newSelectedPlan = currentSelectedPlan.changePlan(toPlan.Name as PLANS);
    const maxMeetsInNewPlan = newSelectedPlan.getTotalUsers();

    // For multi-user personal plans (Duo, Family, PassFamily), the meet addon seat count is locked
    // to the number of members. Always transfer the full seat count so the user doesn't end up
    // with fewer seats than their plan requires (e.g. 1 seat on Family should become 6).
    if (isMultiUserPersonalPlan(toPlan.Name as PLANS)) {
        return maxMeetsInNewPlan;
    }

    // Mirror getLumoWithEnoughSeats: transfer existing count, capped at the new plan's max.
    // e.g. 6 meets on Family → bundle2022 (max 1): Math.min(6, 1) = 1
    //      1 meet  on Mail   → bundle2022 (max 1): Math.min(1, 1) = 1
    return Math.min(meetAddons, maxMeetsInNewPlan);
};

const getLumoWithEnoughSeats = ({
    planIDs,
    lumoAddon,
    organization,
    toPlan,
    plans,
}: {
    planIDs: PlanIDs;
    lumoAddon: Plan;
    organization: Organization | undefined;
    toPlan: Plan;
    plans: Plan[];
}) => {
    const diffAddons = (organization?.MaxLumo || 0) - getPlanFeatureLimit(toPlan, 'MaxLumo');

    const lumoAddonsWithEnoughSeats =
        diffAddons > 0 && getPlanFeatureLimit(lumoAddon, 'MaxLumo')
            ? Math.ceil(diffAddons / getPlanFeatureLimit(lumoAddon, 'MaxLumo'))
            : 0;

    // let count all available lumo addons in the new planIDs selection
    let lumoAddons = 0;
    for (const addonName of Object.values(ADDON_NAMES)) {
        if (isAddonType(addonName, ADDON_PREFIXES.LUMO)) {
            lumoAddons += planIDs[addonName] ?? 0;
        }
    }

    const transferredLumoAddons = Math.max(lumoAddonsWithEnoughSeats, lumoAddons);

    // cycle and currency don't matter in this case, we care about normalizing the planIDs only
    const currentPlan = SelectedPlan.createNormalized(planIDs, plans, CYCLE.MONTHLY, getDefaultMainCurrency());
    const newPlan = currentPlan.changePlan(toPlan.Name as PLANS);

    const maxLumosInNewPlan = newPlan.getTotalUsers();

    return Math.min(transferredLumoAddons, maxLumosInNewPlan);
};

export const clearPlanIDs = (planIDs: PlanIDs): PlanIDs => {
    return Object.entries(planIDs).reduce<PlanIDs>((acc, [planName, quantity = 0]) => {
        if (quantity <= 0) {
            return acc;
        }
        acc[planName as keyof PlanIDs] = quantity;
        return acc;
    }, {});
};

type SwitchPlanOptions = EitherOr<
    EitherOr<
        {
            currentPlanIDs: PlanIDs;
            subscription: Subscription | FreeSubscription | null | undefined;
            newPlan: PLANS | ADDON_NAMES | undefined;
            newPlanIDs: PlanIDs;
            organization: Organization | undefined;
            plans: Plan[];
            /**
             * If you don't want to transfer some addons, you can pass a set of addon types to this parameter.
             * For example, to transfer all addons except lumo, pass `[ADDON_PREFIXES.LUMO]`.
             * If you don't want to transfer any addons, you can pass `true`.
             * If you want to transfer all addons, you can pass an empty set/array or ignore this parameter.
             */
            dontTransferAddons?: Set<ADDON_PREFIXES> | ADDON_PREFIXES[] | ADDON_PREFIXES | boolean;
        },
        'currentPlanIDs' | 'subscription'
    >,
    'newPlan' | 'newPlanIDs'
>;

function getNewPlanIDs({ newPlan, newPlanIDs: newPlanIDsParam }: SwitchPlanOptions): PlanIDs {
    const newPlanIDs = (() => {
        if (newPlanIDsParam) {
            return { ...newPlanIDsParam };
        }

        if (newPlan) {
            return { [newPlan]: 1 };
        }

        return {};
    })();

    if (Object.keys(newPlanIDs).length === 0) {
        return {};
    }

    return newPlanIDs;
}

function getScribeSeatsCoveredByLumo(planIDs: PlanIDs, plans: Plan[]): number {
    const lumoAddonEntry = (Object.entries(planIDs) as [ADDON_NAMES, number][]).find(([addonName]) =>
        isAddonType(addonName, ADDON_PREFIXES.LUMO)
    );
    if (!lumoAddonEntry) {
        return 0;
    }

    const [lumoAddonName, lumoAddonQuantity] = lumoAddonEntry;

    const lumoAddon = plans.find(({ Name }) => Name === lumoAddonName);
    if (!lumoAddon) {
        return 0;
    }

    return getPlanFeatureLimit(lumoAddon, 'MaxAI') * lumoAddonQuantity;
}

export interface TransferAddonArgs {
    addon: ADDON_NAMES;
    currentPlanIDs: PlanIDs;
    newPlanIDs: PlanIDs;
    plan: Plan;
    currentPlan: Plan | undefined;
    organization: Organization;
    plans: Plan[];
    dontTransferAddons: Set<ADDON_PREFIXES>;
    featureLimitKey: FeatureLimitKey;
}

/** A transfer strategy returns the new addon quantity, or `undefined` to keep the carried-over value. */
export type TransferAddonFn = (args: TransferAddonArgs) => number | undefined;

// Find out the smallest number of member addons that could accommodate the previously known usage of the
// resources. For example, if the user had 5 addresses, and each member addon only provides 1 additional
// address, then we would need to add 5 member addons to cover the previous usage. The maximum is chosen
// across all types of resources (space, addresses, VPNs, members, calendars) so as to ensure that the new
// plan covers the maximum usage of any single resource. In addition, we explicitly check how many members
// were used previously.
export const transferMember: TransferAddonFn = ({ addon, currentPlanIDs, plan, currentPlan, organization, plans }) => {
    const memberAddon = plans.find(({ Name }) => Name === addon);
    if (!memberAddon) {
        return undefined;
    }

    const diffSpace =
        ((organization.UsedMembers > 1 ? organization.AssignedSpace : organization.UsedSpace) || 0) - plan.MaxSpace;
    const memberAddonsWithEnoughSpace =
        diffSpace > 0 && memberAddon.MaxSpace ? Math.ceil(diffSpace / memberAddon.MaxSpace) : 0;

    const diffAddresses = (organization.UsedAddresses || 0) - plan.MaxAddresses;
    const memberAddonsWithEnoughAddresses =
        diffAddresses > 0 && memberAddon.MaxAddresses ? Math.ceil(diffAddresses / memberAddon.MaxAddresses) : 0;

    const diffVPN = (organization.UsedVPN || 0) - plan.MaxVPN;
    const memberAddonsWithEnoughVPNConnections =
        diffVPN > 0 && memberAddon.MaxVPN ? Math.ceil(diffVPN / memberAddon.MaxVPN) : 0;

    const diffMembers = (organization.UsedMembers || 0) - plan.MaxMembers;
    const memberAddonsWithEnoughMembers =
        diffMembers > 0 && memberAddon.MaxMembers ? Math.ceil(diffMembers / memberAddon.MaxMembers) : 0;

    const diffCalendars = (organization.UsedCalendars || 0) - plan.MaxCalendars;
    const memberAddonsWithEnoughCalendars =
        diffCalendars > 0 && memberAddon.MaxCalendars ? Math.ceil(diffCalendars / memberAddon.MaxCalendars) : 0;

    // count all available member addons in the new planIDs selection
    let memberAddons = 0;
    for (const addonName of Object.values(ADDON_NAMES)) {
        if (isAddonType(addonName, ADDON_PREFIXES.MEMBER)) {
            memberAddons += currentPlanIDs[addonName] ?? 0;
        }
    }

    if (currentPlan) {
        const membersInTheCurrentPlan = getPlanFeatureLimit(currentPlan, 'MaxMembers');
        const membersInTheNewPlan = getPlanFeatureLimit(plan, 'MaxMembers');
        const membersDifference = Math.max(membersInTheCurrentPlan - membersInTheNewPlan, 0);
        memberAddons += membersDifference;
    }

    return Math.max(
        memberAddonsWithEnoughSpace,
        memberAddonsWithEnoughAddresses,
        memberAddonsWithEnoughVPNConnections,
        memberAddonsWithEnoughMembers,
        memberAddonsWithEnoughCalendars,
        memberAddons
    );
};

export const transferDomain: TransferAddonFn = ({ addon, currentPlanIDs, plan, organization, plans }) => {
    const domainAddon = plans.find(({ Name }) => Name === addon);
    const diffDomains = (organization.UsedDomains || 0) - plan.MaxDomains;

    if (!domainAddon) {
        return undefined;
    }

    return Math.max(
        diffDomains > 0 && domainAddon.MaxDomains ? Math.ceil(diffDomains / domainAddon.MaxDomains) : 0,
        currentPlanIDs[ADDON_NAMES.DOMAIN_BUNDLE_PRO] || 0
    );
};

export const transferScribe: TransferAddonFn = ({
    addon,
    currentPlanIDs,
    newPlanIDs,
    plan,
    organization,
    plans,
    dontTransferAddons,
}) => {
    // It's possible to calculate the number of scribe seats already transfered by lumo addons (implicitely)
    // only because we maintain strict priority of addons processing. Lumo is always processed before Scribe.
    // We need to do this calculation, because addons that grant Lumo seats also grant Scribe seats.
    const additionalScribeSeatsCoveredByLumo = !dontTransferAddons.has(ADDON_PREFIXES.LUMO)
        ? getScribeSeatsCoveredByLumo(newPlanIDs, plans) - getScribeSeatsCoveredByLumo(currentPlanIDs, plans)
        : 0;

    const scribeAddon = plans.find(({ Name }) => Name === addon);
    const diffAIs = (organization.UsedAI || 0) - getPlanFeatureLimit(plan, 'MaxAI');

    if (!scribeAddon) {
        return undefined;
    }

    const scribeAddonsWithEnoughSeats =
        diffAIs > 0 && getPlanFeatureLimit(scribeAddon, 'MaxAI')
            ? Math.ceil(diffAIs / getPlanFeatureLimit(scribeAddon, 'MaxAI'))
            : 0;

    // let count all available Scribe addons in the new planIDs selection
    let scribeAddons = 0;
    for (const addonName of Object.values(ADDON_NAMES)) {
        if (isAddonType(addonName, ADDON_PREFIXES.SCRIBE)) {
            scribeAddons += currentPlanIDs[addonName] ?? 0;
        }
    }

    // We would apply scribeSeatsRequired as the new value of scribe addon if it wouldn't be double
    // controlled both by scribe and lumo addons. Similar to how other addons are transferred. But instead,
    // we are transferring scribeSeatsRequired minus the number of scribe seats implicitly enabled by already
    // present lumo addons.
    const scribeSeatsRequired = Math.max(scribeAddonsWithEnoughSeats, scribeAddons);
    return Math.max(scribeSeatsRequired - additionalScribeSeatsCoveredByLumo, 0);
};

export const transferLumo: TransferAddonFn = ({ addon, currentPlanIDs, newPlanIDs, plan, organization, plans }) => {
    const lumoAddon = plans.find(({ Name }) => Name === addon);
    if (!lumoAddon) {
        return undefined;
    }

    const lumoSeatsRequiredByUser = newPlanIDs[addon] ?? 0;
    // if user requested a Lumo seat, then we will check if their current org already has _Scribe_ seats.
    // If yes, we will replaces Scribes with Lumo.
    const lumoSeatsRequiredByOrg = lumoSeatsRequiredByUser >= 1 ? organization.UsedAI : 0;

    return Math.max(
        lumoSeatsRequiredByUser,
        lumoSeatsRequiredByOrg,
        getLumoWithEnoughSeats({ planIDs: currentPlanIDs, lumoAddon, organization, toPlan: plan, plans })
    );
};

export const transferMeet: TransferAddonFn = ({ currentPlanIDs, plan, plans }) =>
    getMeetWithEnoughSeats({ planIDs: currentPlanIDs, toPlan: plan, plans });

// Computed strategy 'subtract-included': new quantity = current total of the feature minus what the
// new plan already includes.
export const transferSubtractIncluded: TransferAddonFn = ({ currentPlanIDs, newPlanIDs, plans, featureLimitKey }) => {
    // cycle and currency don't matter in this case
    const current = new SelectedPlan(currentPlanIDs, plans, CYCLE.MONTHLY, getDefaultMainCurrency());
    const next = new SelectedPlan(newPlanIDs, plans, CYCLE.MONTHLY, getDefaultMainCurrency());

    return current.getTotal(featureLimitKey) - next.getCountInPlan(featureLimitKey);
};

const transferHandlers: Record<AddonTransferStrategy, TransferAddonFn> = {
    member: transferMember,
    domain: transferDomain,
    scribe: transferScribe,
    lumo: transferLumo,
    meet: transferMeet,
    'subtract-included': transferSubtractIncluded,
};

/**
 * Transfer addons from one plan to another. In different plans, addons have different names
 * and potentially different resource limits, so they must be converted manually using this function.
 *
 * The function can accept `subscription` or `currentPlanIDs` as an argument. It's recommended to use `subscription`,
 * because it provides more information such as `External` property. If you don't provide `subscription`, you need to
 * make sure that `dontTransferAddons` is set correctly.
 *
 * @returns
 */
export const switchPlan = (options: SwitchPlanOptions): PlanIDs => {
    const newPlanIDs = getNewPlanIDs(options);
    if (Object.keys(newPlanIDs).length === 0) {
        return {};
    }

    const {
        currentPlanIDs: currentPlanIDsParam,
        subscription,
        organization,
        plans,
        dontTransferAddons: dontTransferAddonsParam = new Set(),
    } = options;

    const currentPlanIDs = currentPlanIDsParam ?? getPlanIDs(subscription);

    // Simply normalizing the dontTransferAddons param to a Set.
    const dontTransferAddons: Set<ADDON_PREFIXES> = (() => {
        let initialSet: readonly ADDON_PREFIXES[];
        if (typeof dontTransferAddonsParam === 'boolean') {
            initialSet = ALL_ADDON_PREFIXES;
        } else if (typeof dontTransferAddonsParam === 'string') {
            initialSet = [dontTransferAddonsParam];
        } else {
            initialSet = [...dontTransferAddonsParam];
        }

        return new Set(initialSet);
    })();

    // If user has a mobile lumo subscription and wants to buy any other plan, we don't transfer lumo addons, because
    // it doesn't make sense to have Lumo Plus mobile on web and, for example, Unlimited with +1 lumo addon on web.
    // This code isn't exactly scalable in case if we allow more combinations of multi-subs. Perhaps in the future
    // we can remove addons from the resulting newPlanIDs instead of manipulating the dontTransferAddons set.
    {
        const multisubs = subscription && !isFreeSubscription(subscription) ? getSubscriptionsArray(subscription) : [];
        const hasExternallyManagedLumo = multisubs.some((sub) => isManagedExternally(sub) && hasLumo(sub));
        if (hasExternallyManagedLumo) {
            dontTransferAddons.add(ADDON_PREFIXES.LUMO);
        }
    }

    const supportedAddons = getSupportedAddons(newPlanIDs);
    const plan = plans.find(({ Name }) => Name === getPlanNameFromIDs(newPlanIDs));
    const currentPlan = plans.find(({ Name }) => Name === getPlanNameFromIDs(currentPlanIDs));

    // Transfer order is registry-derived (see getTransferOrder): base render order with a seat-pool
    // overlay so a pool's preferred type (lumo) is processed before its peers (scribe).
    const transferOrder = getTransferOrder();
    const transferIndex = (name: ADDON_NAMES): number => {
        const addonType = getAddonConfigByName(name)?.addonType;
        const index = addonType ? transferOrder.indexOf(addonType) : -1;
        return index === -1 ? transferOrder.length : index;
    };
    const supportedAddonNames = (Object.keys(supportedAddons) as ADDON_NAMES[]).sort(
        (a, b) => transferIndex(a) - transferIndex(b)
    );

    // Transfer addons. Each addon's transfer rule comes from its config: a generic strategy or a
    // named billing function (member 5-resource calc, scribe↔lumo coupling, meet member-lock, …).
    supportedAddonNames.forEach((addon) => {
        const quantity = currentPlanIDs[addon as keyof PlanIDs];
        if (quantity) {
            newPlanIDs[addon] = quantity;
        }

        const config = getAddonConfigByName(addon);
        if (!plan || !config || dontTransferAddons.has(config.addonType)) {
            return;
        }

        const transferOnPlanSwitch = transferHandlers[config.transferStrategy];
        // Meet is the only transfer that doesn't require organization data; every other strategy
        // keeps the carried-over quantity when the organization is unknown (matching prior behaviour).
        const isMeet = config.transferStrategy === 'meet';
        if (!isMeet && !organization) {
            return;
        }

        const args: TransferAddonArgs = {
            addon,
            currentPlanIDs,
            newPlanIDs,
            plan,
            currentPlan,
            organization: organization as Organization,
            plans,
            dontTransferAddons,
            featureLimitKey: config.featureLimit.key,
        };

        const value = transferOnPlanSwitch(args);

        if (value !== undefined) {
            newPlanIDs[addon] = value;
        }
    });

    return clearPlanIDs(newPlanIDs);
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

export function planIDsPositiveDifference(oldPlanIDs: PlanIDs, newPlanIDs: PlanIDs): PlanIDs {
    if (!oldPlanIDs || !newPlanIDs) {
        return {};
    }

    const increasedPlanIDs: PlanIDs = {};

    for (const key of Object.keys(newPlanIDs) as (keyof PlanIDs)[]) {
        const newQuantity = newPlanIDs[key] ?? 0;
        const oldQuantity = oldPlanIDs[key] ?? 0;

        const increase = newQuantity - oldQuantity;
        if (increase > 0) {
            increasedPlanIDs[key] = increase;
        }
    }

    return increasedPlanIDs;
}

export function getAddonsFromIDs(planIDs: PlanIDs): PlanIDs {
    const addonIDs = { ...planIDs };
    Object.keys(addonIDs)
        .filter((it) => isValidPlanName(it))
        .forEach((it) => {
            delete addonIDs[it as keyof PlanIDs];
        });
    return addonIDs;
}
