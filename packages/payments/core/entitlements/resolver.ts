import { entitlementChecks } from './checks';
import {
    getEntitlementQuantity,
    getOrgEntitlementQuantity,
    resolveEntitlement,
    resolveOrgEntitlement,
} from './helpers';
import type { EntitlementResolverInternal, Entitlements } from './interface';

const createBaseResolver = (entitlements: Entitlements | undefined): EntitlementResolverInternal => ({
    resolve: (name) => resolveEntitlement(entitlements, name),
    resolveOrg: (name) => resolveOrgEntitlement(entitlements, name),
    quantity: (name) => getEntitlementQuantity(entitlements, name),
    quantityOrg: (name) => getOrgEntitlementQuantity(entitlements, name),
});

type BoundEntitlementChecks = {
    [K in keyof typeof entitlementChecks]: ReturnType<(typeof entitlementChecks)[K]>;
};

export type EntitlementChecks = EntitlementResolverInternal & BoundEntitlementChecks;

/**
 * Wraps a loaded set of entitlements in an {@link EntitlementResolverInternal} so callers query by name
 * alone, with the named {@link entitlementChecks} bound under `.checks`.
 */
export const createEntitlementResolver = (entitlements: Entitlements | undefined): EntitlementChecks => {
    const resolver = createBaseResolver(entitlements);
    const checks = {} as Record<string, unknown>;
    for (const [name, check] of Object.entries(entitlementChecks)) {
        checks[name] = check(resolver);
    }

    const boundChecks = checks as BoundEntitlementChecks;

    return { ...resolver, ...boundChecks };
};
