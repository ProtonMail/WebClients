import type { EntitlementName } from './entitlement-names';
import { EntitlementScope, type Entitlements, type ResolvedEntitlement } from './interface';

/** Resolves what the current member gets for an entitlement. */
export const resolveEntitlement = (
    entitlements: Entitlements | undefined,
    name: EntitlementName
): ResolvedEntitlement => {
    const memberMatch = entitlements?.MemberEntitlements?.find((e) => e.Name === name);
    const orgMatch = entitlements?.OrganizationEntitlements?.find((e) => e.Name === name);

    // Scope must be the same for a given entitlement key, so it doesn't matter where to read it from
    const scope = memberMatch?.Scope ?? orgMatch?.Scope ?? EntitlementScope.Global;

    // If the selected entitlement is distributed then we care only about whether the given user has it or not. This if
    // condition is very important in the context of entitlements for the current user. If the distributed entitlement
    // exists on the org level but not on the memebr level, then it's a signal that this org has this entitlement but
    // the current user didn't receive allocation for it. So effectively in this case the current user doesn't have this
    // entitlement.
    if (scope === EntitlementScope.Distributed) {
        const quantity = memberMatch?.Quantity ?? 0;
        return { name, quantity, scope };
    }

    // If the entitlement is global then we should read it from the organization entitlements.
    const quantity = orgMatch?.Quantity ?? 0;
    return { name, quantity, scope };
};

/** Resolves what the whole organization is granted for an entitlement. */
export const resolveOrgEntitlement = (
    entitlements: Entitlements | undefined,
    name: EntitlementName
): ResolvedEntitlement => {
    const orgMatch = entitlements?.OrganizationEntitlements.find((e) => e.Name === name);

    const quantity = orgMatch?.Quantity ?? 0;
    const scope = orgMatch?.Scope ?? EntitlementScope.Global;

    return { name, quantity, scope };
};

/** Amount the current member gets; 0 when none. */
export const getEntitlementQuantity = (entitlements: Entitlements | undefined, name: EntitlementName): number =>
    resolveEntitlement(entitlements, name).quantity;

/** Amount granted to the whole organization; 0 when none. */
export const getOrgEntitlementQuantity = (entitlements: Entitlements | undefined, name: EntitlementName): number =>
    resolveOrgEntitlement(entitlements, name).quantity;
