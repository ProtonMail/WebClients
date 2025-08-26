import { type EitherOr, type Organization } from '@proton/shared/lib/interfaces';

import { ADDON_NAMES, CYCLE, DEFAULT_CURRENCY, PLANS, PLAN_TYPES } from './constants';
import { type FreeSubscription, type PlanIDs } from './interface';
import { getSupportedAddons, isDomainAddon, isIpAddon, isLumoAddon, isMemberAddon, isScribeAddon } from './plan/addons';
import { getPlanNameFromIDs } from './plan/helpers';
import { type Plan, type PlansMap } from './plan/interface';
import { getPricePerCycle, getPricePerMember } from './price-helpers';
import {
    type AggregatedPricing,
    type PricingForCycles,
    allCycles,
    getPlanFeatureLimit,
    getPlanIDs,
    getPlanMembers,
    getSubscriptionsArray,
    hasLumoPlan,
    isManagedExternally,
} from './subscription/helpers';
import { type Subscription, type SubscriptionCheckResponse } from './subscription/interface';
import { SelectedPlan } from './subscription/selected-plan';
import { isFreeSubscription } from './type-guards';

export const hasPlanIDs = (planIDs: PlanIDs) => Object.values(planIDs).some((quantity) => quantity > 0);
export const hasFreePlanIDs = (planIDs: PlanIDs) => !hasPlanIDs(planIDs) || Boolean(planIDs[PLANS.FREE]);

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
        if (isLumoAddon(addonName)) {
            lumoAddons += planIDs[addonName] ?? 0;
        }
    }

    const transferredLumoAddons = Math.max(lumoAddonsWithEnoughSeats, lumoAddons);

    // cycle and currency don't matter in this case, we care about normalizing the planIDs only
    const currentPlan = SelectedPlan.createNormalized(planIDs, plans, CYCLE.MONTHLY, DEFAULT_CURRENCY);
    const newPlan = currentPlan.changePlan(toPlan.Name as PLANS);

    const maxLumosInNewPlan = newPlan.getMaxLumos();

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

const allAddons = ['lumo', 'ip', 'scribe', 'member', 'domain'] as const;
type Addons = (typeof allAddons)[number];

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
             * If you don't want to transfer some addons, you can pass a set of addons to this parameter.
             * For example, if you want to transfer all addons except for `lumo`, you can pass `['lumo']`.
             * If you don't want to transfer any addons, you can pass `true`.
             * If you want to transfer all addons, you can pass an empty set/array or ignore this parameter.
             */
            dontTransferAddons?: Set<Addons> | Addons[] | Addons | boolean;
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
    const dontTransferAddons: Set<Addons> = (() => {
        let initialSet: readonly Addons[];
        if (typeof dontTransferAddonsParam === 'boolean') {
            initialSet = allAddons;
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
        const hasExternallyManagedLumo = multisubs.some((sub) => isManagedExternally(sub) && hasLumoPlan(sub));
        if (hasExternallyManagedLumo) {
            dontTransferAddons.add('lumo');
        }
    }

    const supportedAddons = getSupportedAddons(newPlanIDs);
    const plan = plans.find(({ Name }) => Name === getPlanNameFromIDs(newPlanIDs));

    const supportedAddonNames = Object.keys(supportedAddons) as ADDON_NAMES[];
    // Transfer addons
    supportedAddonNames.forEach((addon) => {
        const quantity = currentPlanIDs[addon as keyof PlanIDs];

        if (quantity) {
            newPlanIDs[addon] = quantity;
        }

        // Transfer member addons
        if (isMemberAddon(addon) && plan && organization && !dontTransferAddons.has('member')) {
            const memberAddon = plans.find(({ Name }) => Name === addon);

            if (memberAddon) {
                // Find out the smallest number of member addons that could accommodate the previously known usage
                // of the resources. For example, if the user had 5 addresses, and each member addon only
                // provides 1 additional address, then we would need to add 5 member addons to cover the previous
                // usage. The maximum is chosen across all types of resources (space, addresses, VPNs, members,
                // calendars) so as to ensure that the new plan covers the maximum usage of any single resource.
                // In addition, we explicitely check how many members were used previously.

                const diffSpace =
                    ((organization.UsedMembers > 1 ? organization.AssignedSpace : organization.UsedSpace) || 0) -
                    plan.MaxSpace; // AssignedSpace is the space assigned to members in the organization which count for addon transfer
                const memberAddonsWithEnoughSpace =
                    diffSpace > 0 && memberAddon.MaxSpace ? Math.ceil(diffSpace / memberAddon.MaxSpace) : 0;

                const diffAddresses = (organization.UsedAddresses || 0) - plan.MaxAddresses;
                const memberAddonsWithEnoughAddresses =
                    diffAddresses > 0 && memberAddon.MaxAddresses
                        ? Math.ceil(diffAddresses / memberAddon.MaxAddresses)
                        : 0;

                const diffVPN = (organization.UsedVPN || 0) - plan.MaxVPN;
                const memberAddonsWithEnoughVPNConnections =
                    diffVPN > 0 && memberAddon.MaxVPN ? Math.ceil(diffVPN / memberAddon.MaxVPN) : 0;

                const diffMembers = (organization.UsedMembers || 0) - plan.MaxMembers;
                const memberAddonsWithEnoughMembers =
                    diffMembers > 0 && memberAddon.MaxMembers ? Math.ceil(diffMembers / memberAddon.MaxMembers) : 0;

                const diffCalendars = (organization.UsedCalendars || 0) - plan.MaxCalendars;
                const memberAddonsWithEnoughCalendars =
                    diffCalendars > 0 && memberAddon.MaxCalendars
                        ? Math.ceil(diffCalendars / memberAddon.MaxCalendars)
                        : 0;

                // count all available member addons in the new planIDs selection
                let memberAddons = 0;
                for (const addonName of Object.values(ADDON_NAMES)) {
                    if (isMemberAddon(addonName)) {
                        memberAddons += currentPlanIDs[addonName] ?? 0;
                    }
                }

                newPlanIDs[addon] = Math.max(
                    memberAddonsWithEnoughSpace,
                    memberAddonsWithEnoughAddresses,
                    memberAddonsWithEnoughVPNConnections,
                    memberAddonsWithEnoughMembers,
                    memberAddonsWithEnoughCalendars,
                    memberAddons
                );
            }
        }

        // Transfer domain addons
        if (isDomainAddon(addon) && plan && organization && !dontTransferAddons.has('domain')) {
            const domainAddon = plans.find(({ Name }) => Name === addon);
            const diffDomains = (organization.UsedDomains || 0) - plan.MaxDomains;

            if (domainAddon) {
                newPlanIDs[addon] = Math.max(
                    diffDomains > 0 && domainAddon.MaxDomains ? Math.ceil(diffDomains / domainAddon.MaxDomains) : 0,
                    currentPlanIDs[ADDON_NAMES.DOMAIN_BUNDLE_PRO] || 0
                );
            }
        }

        if (isScribeAddon(addon) && plan && organization && !dontTransferAddons.has('scribe')) {
            const gptAddon = plans.find(({ Name }) => Name === addon);
            const diffAIs = (organization.UsedAI || 0) - getPlanFeatureLimit(plan, 'MaxAI');

            if (gptAddon) {
                const gptAddonsWithEnoughSeats =
                    diffAIs > 0 && getPlanFeatureLimit(gptAddon, 'MaxAI')
                        ? Math.ceil(diffAIs / getPlanFeatureLimit(gptAddon, 'MaxAI'))
                        : 0;

                // let count all available GPT addons in the new planIDs selection
                let gptAddons = 0;
                for (const addonName of Object.values(ADDON_NAMES)) {
                    if (isScribeAddon(addonName)) {
                        gptAddons += currentPlanIDs[addonName] ?? 0;
                    }
                }

                newPlanIDs[addon] = Math.max(gptAddonsWithEnoughSeats, gptAddons);
            }
        }

        if (isLumoAddon(addon) && plan && organization && !dontTransferAddons.has('lumo')) {
            const lumoAddon = plans.find(({ Name }) => Name === addon);

            if (lumoAddon) {
                newPlanIDs[addon] = getLumoWithEnoughSeats({
                    planIDs: currentPlanIDs,
                    lumoAddon,
                    organization,
                    toPlan: plan,
                    plans,
                });
            }
        }

        if (isIpAddon(addon) && plan && organization && !dontTransferAddons.has('ip')) {
            // cycle and currency don't matter in this case
            const currentPlan = new SelectedPlan(currentPlanIDs, plans, CYCLE.MONTHLY, DEFAULT_CURRENCY);
            const newPlan = new SelectedPlan(newPlanIDs, plans, CYCLE.MONTHLY, DEFAULT_CURRENCY);

            const totalIPs = currentPlan.getTotalIPs();
            const ipAddonsRequired = totalIPs - newPlan.getIncludedIPs();

            newPlanIDs[addon] = ipAddonsRequired;
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

export function getPlanFromIDs(planIDs: PlanIDs, plansMap: PlansMap): Plan | undefined {
    const planName = getPlanNameFromIDs(planIDs);
    return planName ? plansMap[planName] : undefined;
}

export const getPricingFromPlanIDs = (planIDs: PlanIDs, plansMap: PlansMap): AggregatedPricing => {
    const initial = {
        [CYCLE.MONTHLY]: 0,
        [CYCLE.YEARLY]: 0,
        [CYCLE.THREE]: 0,
        [CYCLE.SIX]: 0,
        [CYCLE.EIGHTEEN]: 0,
        [CYCLE.TWO_YEARS]: 0,
        [CYCLE.FIFTEEN]: 0,
        [CYCLE.THIRTY]: 0,
    };

    return Object.entries(planIDs).reduce<AggregatedPricing>(
        (acc, [planName, quantity]) => {
            const plan = plansMap[planName as keyof PlansMap];
            if (!plan) {
                return acc;
            }

            const members = getPlanMembers(plan, quantity);
            acc.membersNumber += members;

            const add = (target: PricingForCycles, cycle: CYCLE) => {
                const price = getPricePerCycle(plan, cycle);
                if (price) {
                    target[cycle] += quantity * price;
                }
            };

            const addMembersPricing = (target: PricingForCycles, cycle: CYCLE) => {
                const price = getPricePerMember(plan, cycle);
                if (price) {
                    target[cycle] += members * price;
                }
            };

            allCycles.forEach((cycle) => {
                add(acc.all, cycle);
            });

            if (members !== 0) {
                allCycles.forEach((cycle) => {
                    addMembersPricing(acc.members, cycle);
                });
            }

            if (plan.Type === PLAN_TYPES.PLAN) {
                allCycles.forEach((cycle) => {
                    add(acc.plans, cycle);
                });

                acc.defaultMonthlyPriceWithoutAddons += quantity * (getPricePerCycle(plan, CYCLE.MONTHLY) ?? 0);
            }

            const defaultMonthly = plan.DefaultPricing?.[CYCLE.MONTHLY] ?? 0;
            const monthly = getPricePerCycle(plan, CYCLE.MONTHLY) ?? 0;

            // Offers might affect Pricing both ways, increase and decrease.
            // So if the Pricing increases, then we don't want to use the lower DefaultPricing as basis
            // for discount calculations
            const price = Math.max(defaultMonthly, monthly);

            acc.defaultMonthlyPrice += quantity * price;

            return acc;
        },
        {
            defaultMonthlyPrice: 0,
            defaultMonthlyPriceWithoutAddons: 0,
            all: { ...initial },
            members: {
                ...initial,
            },
            plans: {
                ...initial,
            },
            membersNumber: 0,
        }
    );
};

export type PricingMode = 'all' | 'plans';

export type TotalPricing = ReturnType<typeof getTotalFromPricing>;

// todo: replace signature with SelectedPlan only
export const getTotalFromPricing = (
    pricing: AggregatedPricing,
    cycle: CYCLE,
    mode: PricingMode = 'all',
    additionalCheckResults?: SubscriptionCheckResponse[],
    selectedPlan?: SelectedPlan
) => {
    type CheckedPrices = Record<
        CYCLE,
        {
            Amount: number;
            CouponDiscount: number;
        }
    >;

    const checkedPrices =
        additionalCheckResults?.reduce((acc, { CouponDiscount = 0, Cycle, Amount }) => {
            acc[Cycle] = {
                Amount,
                CouponDiscount,
            };

            return acc;
        }, {} as CheckedPrices) ?? ({} as CheckedPrices);

    const { defaultMonthlyPrice, defaultMonthlyPriceWithoutAddons } = pricing;

    const total = checkedPrices[cycle]?.Amount ?? pricing[mode][cycle];

    const couponDiscount = Math.abs(checkedPrices[cycle]?.CouponDiscount ?? 0);

    const discountedTotal = total - couponDiscount;
    const totalPerMonth = discountedTotal / cycle;

    const price = mode === 'all' ? defaultMonthlyPrice : defaultMonthlyPriceWithoutAddons;
    const totalNoDiscount = price * cycle;
    const discount = cycle === CYCLE.MONTHLY ? couponDiscount : totalNoDiscount - discountedTotal;

    const membersPricePerMonthWithoutDiscount = Math.floor(pricing.members[cycle] / cycle);
    const memberShare = membersPricePerMonthWithoutDiscount / (total / cycle);
    const membersDiscount = Math.floor(couponDiscount * memberShare);
    const discountPerUserPerMonth = membersDiscount / pricing.membersNumber / cycle;
    const perUserPerMonth = membersPricePerMonthWithoutDiscount / pricing.membersNumber - discountPerUserPerMonth;

    const viewPricePerMonth = selectedPlan?.isB2BPlan() ? perUserPerMonth : totalPerMonth;

    return {
        discount,
        discountPercentage: discount > 0 ? Math.round((discount / totalNoDiscount) * 100) : 0,
        discountedTotal,
        totalPerMonth,
        totalNoDiscountPerMonth: totalNoDiscount / cycle,
        perUserPerMonth,
        viewPricePerMonth,
    };
};

export type TotalPricings = {
    [key in CYCLE]: TotalPricing;
};

export function getTotals(
    planIDs: PlanIDs,
    plansMap: PlansMap,
    additionalCheckResults: SubscriptionCheckResponse[],
    mode?: PricingMode,
    selectedPlan?: SelectedPlan
): TotalPricings {
    const pricing = getPricingFromPlanIDs(planIDs, plansMap);

    return allCycles.reduce<{ [key in CYCLE]: TotalPricing }>((acc, cycle) => {
        acc[cycle] = getTotalFromPricing(pricing, cycle, mode, additionalCheckResults, selectedPlan);
        return acc;
    }, {} as any);
}
