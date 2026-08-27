import { useCallback, useMemo } from 'react';

import { useAllEntitlements, useGetAllEntitlements } from '@proton/account/entitlements/hooks';
import { type EntitlementChecks, createEntitlementResolver } from '@proton/payments/core/entitlements/resolver';

/**
 * Returns an EntitlementChecks and its loading state.
 *
 * User/member and org entitlements require calls of different functions, because different UIs have different needs.
 * For example, as an admin of an organization, I can have two questions: what are overall entitlements for my
 * organization, and what are the entitlements of my user specifically? The first question is answered by the org
 * entitlements, the second question is answered by the user/member entitlements. Before calling a function, carefully
 * consider what is your use case and what question your page is trying to answer.
 *
 * - resolver.resolve(name)      → user-effective ResolvedEntitlement (scope derived from Entitlement.Scope)
 * - resolver.resolveOrg(name)   → org-total ResolvedEntitlement (always reads OrganizationEntitlements)
 * - resolver.quantity(name)     → user-effective quantity (number)
 * - resolver.quantityOrg(name)  → org-total quantity (number)
 *
 * Examples of quick checks:
 * - resolver.orgIsBusiness
 * - resolver.orgHasLumo
 * - resolver.orgHasSentinel
 * - resolver.orgHasVpn
 *
 * @example
 * const [entitlements, loading] = useEntitlements();
 * const maxSpace = entitlements.quantity(EntitlementName.MaxSpace);
 * const isBusiness = entitlements.isBusiness;
 */
export const useEntitlementChecks = (): [EntitlementChecks, boolean] => {
    const [allEntitlements, loading] = useAllEntitlements();

    const resolver = useMemo(() => createEntitlementResolver(allEntitlements), [allEntitlements]);

    return [resolver, loading];
};

/**
 * Returns a function that lazily resolves entitlements on demand.
 *
 * Use this over useEntitlements in contexts where the Redux cache may not be
 * initialized yet, such as the v2 signup page or early app initialization.
 *
 * @example
 * const getEntitlements = useGetEntitlements();
 * // call later, e.g. inside an event handler or effect
 * const entitlements = await getEntitlements();
 * const maxSpace = entitlements.quantity(EntitlementName.MaxSpace);
 */
export const useGetEntitlements = (): (() => Promise<EntitlementChecks>) => {
    const getAllEntitlements = useGetAllEntitlements();

    return useCallback(() => getAllEntitlements().then(createEntitlementResolver), [getAllEntitlements]);
};
