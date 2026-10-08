import type { Subscription } from '../subscription/interface';
import type { EntitlementName } from './entitlement-names';
import {
    type EntitlementResolveConditions,
    EntitlementScope,
    type Entitlements,
    type ResolvedEntitlement,
} from './interface';

/** Resolves what the current member gets for an entitlement, after the admin's allocation. */
export const resolveEntitlementForMember = (
    entitlements: Entitlements | undefined,
    name: EntitlementName
): ResolvedEntitlement => {
    const memberMatch = entitlements?.MemberEntitlements?.find((e) => e.Name === name);
    const orgMatch = entitlements?.OrganizationEntitlements?.find((e) => e.Name === name);

    // Scope must be the same for a given entitlement key, so it doesn't matter where to read it from
    const scope = memberMatch?.Scope ?? orgMatch?.Scope ?? EntitlementScope.Organization;

    // If the selected entitlement is member-assignable then we care only about whether the given user has it or not.
    // This if condition is very important in the context of entitlements for the current user. If the
    // member-assignable entitlement exists on the org level but not on the member level, then it's a signal that this
    // org has this entitlement but the current user didn't receive allocation for it. So effectively in this case the
    // current user doesn't have this entitlement.
    if (scope === EntitlementScope.MemberAssignable) {
        const quantity = memberMatch?.Quantity ?? 0;
        return { name, quantity, scope };
    }

    // Member-scoped entitlements are defined at the org level and distributed evenly to all members.
    // By default they don't appear in MemberEntitlements, but an admin can override the value for
    // an individual member. So prefer the per-member override if it exists, otherwise fall back to
    // the org quantity. Note that a 0-quantity override is meaningful, hence `??` instead of `||`.
    if (scope === EntitlementScope.Member) {
        const quantityMemberOverride = memberMatch?.Quantity;
        const quantityOrg = orgMatch?.Quantity ?? 0;

        const quantity = quantityMemberOverride ?? quantityOrg;
        return { name, quantity, scope };
    }

    // If the entitlement is not member-assignable then we should read it from the organization entitlements.
    const quantity = orgMatch?.Quantity ?? 0;
    return { name, quantity, scope };
};

/** Resolves everything that is granted for an entitlement, before any split across members. */
export const resolveTotalEntitlement = (
    entitlements: Entitlements | undefined,
    name: EntitlementName
): ResolvedEntitlement => {
    const orgMatch = entitlements?.OrganizationEntitlements.find((e) => e.Name === name);

    const quantity = orgMatch?.Quantity ?? 0;
    const scope = orgMatch?.Scope ?? EntitlementScope.Organization;

    return { name, quantity, scope };
};

/** Looks up one entitlement in already folded grants, falling back to a not-granted entry. */
export const resolveGrantedEntitlement = (grants: ResolvedEntitlement[], name: EntitlementName): ResolvedEntitlement =>
    grants.find((entitlement) => entitlement.name === name) ?? {
        name,
        quantity: 0,
        scope: EntitlementScope.Organization,
    };

// A quantity of 0 means the entitlement is not granted even though the name is present in the grants.
export const hasGrantedEntitlement = (grants: ResolvedEntitlement[], name: EntitlementName): boolean =>
    resolveGrantedEntitlement(grants, name).quantity > 0;

/** Amount the current member gets; 0 when none. */
export const getEntitlementQuantityForMember = (
    entitlements: Entitlements | undefined,
    name: EntitlementName
): number => resolveEntitlementForMember(entitlements, name).quantity;

/** Amount granted in total, before any split across members; 0 when not granted. */
export const getTotalEntitlementQuantity = (entitlements: Entitlements | undefined, name: EntitlementName): number =>
    resolveTotalEntitlement(entitlements, name).quantity;

export function checkConditions(
    conditions: EntitlementResolveConditions,
    entitlements: ResolvedEntitlement[]
): boolean {
    const excludes = conditions.excludes ?? [];
    if (conditions.includes.length === 0 && excludes.length > 0) {
        return false;
    }

    // A quantity of 0 means the entitlement is not granted: a Switch entitlement is off, and a
    // Value entitlement of 0 is nothing. Such an entry must not satisfy `includes`, and must not
    // trip `excludes` either.
    const entitlementNamesPerPlan = new Set(entitlements.filter((e) => e.quantity > 0).map((e) => e.name));

    const allIncludesMatch = conditions.includes.every((entitlementName) =>
        entitlementNamesPerPlan.has(entitlementName)
    );

    const allExcludesMatch = excludes.every((entitlementName) => !entitlementNamesPerPlan.has(entitlementName));

    return allIncludesMatch && allExcludesMatch;
}

export type EntitlementsPerSubscription = { subscription: Subscription; entitlements: ResolvedEntitlement[] }[];

export const findSubscriptionsMatching = (
    conditions: EntitlementResolveConditions,
    entitlementsPerSubscription: EntitlementsPerSubscription
) => {
    let result = false;
    const subscriptions = [];
    for (const { subscription, entitlements } of entitlementsPerSubscription) {
        if (checkConditions(conditions, entitlements)) {
            result = true;
            subscriptions.push(subscription);
        }
    }

    return {
        result,
        subscriptions,
    };
};
