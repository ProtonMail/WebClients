import { useCallback, useMemo } from 'react';

import type {
    EntitlementChecksForOrgAndUser,
    EntitlementChecksForSelection,
    PlanSelectionForEntitlementChecks,
} from '@proton/payments/core/entitlements/interface';
import {
    createEntitlementResolverForOrgAndUser,
    createEntitlementResolverForSelection,
} from '@proton/payments/core/entitlements/resolver';
import { createHooks } from '@proton/redux-utilities/hooks';

import { useAllEntitlements } from '../entitlements/hooks';
import { useSubscription } from '../subscription/hooks';
import { entitlementCatalogThunk, selectEntitlementCatalog } from './index';

const hooks = createHooks(entitlementCatalogThunk, selectEntitlementCatalog);

/**
 * The generic entitlements catalog: what each plan and addon nominally grants, identical for all users.
 *
 * This is plumbing for the resolver factories. To answer a question about the current organization or user, use
 * {@link useEntitlementChecksForOrgAndUser} instead; the catalog only knows about plans.
 */
export const useEntitlementCatalog = hooks.useValue;
export const useGetEntitlementCatalog = hooks.useGet;

/**
 * Returns an EntitlementChecksForOrgAndUser and its loading state.
 *
 * This is the default entry point for entitlement questions: it answers about what the current organization and user
 * actually have, which is the precise source. Reach for {@link useEntitlementChecksForPlanSelection} /
 * {@link useCreateEntitlementChecksForPlanSelection} only for plan questions ("does this plan include VPN?"), or call
 * `withSelection` on the resolver returned here when you need both answers side by side.
 *
 * User/member and org entitlements require calls of different functions, because different UIs have different needs.
 * For example, as an admin of an organization, I can have two questions: what are overall entitlements for my
 * organization, and what are the entitlements of my user specifically? The first question is answered by the org
 * entitlements, the second question is answered by the user/member entitlements. Before calling a function, carefully
 * consider what is your use case and what question your page is trying to answer.
 *
 * - resolver.resolveForMember(name)  → user-effective ResolvedEntitlement (scope derived from Entitlement.Scope)
 * - resolver.resolveTotal(name)      → org-total ResolvedEntitlement (always reads OrganizationEntitlements)
 * - resolver.quantityForMember(name) → user-effective quantity (number)
 * - resolver.quantityTotal(name)     → org-total quantity (number)
 *
 * Examples of quick checks:
 * - resolver.isBusiness
 * - resolver.hasLumo
 * - resolver.hasSentinel
 * - resolver.hasVpn
 *
 * @example
 * const [entitlements, loading] = useEntitlementChecksForOrgAndUser();
 * const maxSpace = entitlements.quantityForMember(EntitlementName.MaxSpace);
 * const isBusiness = entitlements.isBusiness;
 */
export const useEntitlementChecksForOrgAndUser = (): [EntitlementChecksForOrgAndUser, boolean] => {
    const [allEntitlements, loadingEntitlements] = useAllEntitlements();
    const [subscription, loadingSubscription] = useSubscription();
    const [entitlementCatalog, loadingEntitlementCatalog] = useEntitlementCatalog();

    const resolver = useMemo(() => {
        return createEntitlementResolverForOrgAndUser(entitlementCatalog, allEntitlements, subscription);
    }, [entitlementCatalog, allEntitlements, subscription]);

    const loading = loadingEntitlements || loadingSubscription || loadingEntitlementCatalog;
    return [resolver, loading];
};

/**
 * Returns a function that creates a resolver answering entitlement questions about a specific plan selection
 * (plan name, PlanIDs, subscription), independently of what the current user or organization actually has.
 *
 * Use this when the selection is only known later — e.g. inside an event handler or a checkout flow. When the
 * selection is already available during render, prefer {@link useEntitlementChecksForPlanSelection}.
 *
 * Note: this resolver compares against the generic entitlements catalog, not against the user's actual entitlements.
 * Prefer {@link useEntitlementChecksForOrgAndUser} (backed by {@link createEntitlementResolverForOrgAndUser}) for
 * questions about the current organization or user; use the selection resolver only for plan questions, such as
 * "does this plan include VPN?" or "what would this subscription grant?".
 *
 * @example
 * const getResolver = useCreateEntitlementChecksForPlanSelection();
 * const handlePlanClick = (planName: PlanName) => {
 *     const resolver = getResolver(planName);
 *     if (!resolver.hasVpn) {
 *         showUpgradeHint();
 *     }
 * };
 */
export const useCreateEntitlementChecksForPlanSelection = () => {
    const [entitlementCatalog] = useEntitlementCatalog();

    return useCallback(
        (selection: PlanSelectionForEntitlementChecks) =>
            createEntitlementResolverForSelection(entitlementCatalog, selection),
        [entitlementCatalog]
    );
};

/**
 * Same as {@link useCreateEntitlementChecksForPlanSelection}, but returns a memoized resolver for a selection that is
 * already known during render. Pass a reference-stable `selection`, otherwise the memo is defeated.
 *
 * Note: this resolver compares against the generic entitlements catalog, not against the user's actual entitlements.
 * Prefer {@link useEntitlementChecksForOrgAndUser} for questions about the current organization or user; use the
 * selection resolver only for plan questions, such as "does this plan include VPN?" or "what would this subscription
 * grant?".
 *
 * @example
 * const [checks] = useEntitlementChecksForPlanSelection(planName);
 * const planHasVpn = checks.hasVpn;
 */
export const useEntitlementChecksForPlanSelection = (
    selection: PlanSelectionForEntitlementChecks
): [EntitlementChecksForSelection, boolean] => {
    const [entitlementCatalog, loading] = useEntitlementCatalog();

    const checks = useMemo(() => {
        return createEntitlementResolverForSelection(entitlementCatalog, selection);
    }, [entitlementCatalog, selection]);

    return [checks, loading];
};
