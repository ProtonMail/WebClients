import type { PlanIDs } from '../interface';
import { getSubscriptionsArray } from '../subscription/helpers';
import { getPlanIDs } from '../subscription/helpers/plan-ids';
import type { MaybeFreeSubscription, Subscription } from '../subscription/interface';
import { isFreeSubscription, isPaidSubscription, isValidPlanName } from '../type-guards';
import { entitlementChecksForOrgAndUser, entitlementChecksForSelection } from './checks';
import { getEntitlementsPerPlan, getEntitlementsPerSubscription } from './entitlement-grants';
import type { EntitlementName } from './entitlement-names';
import {
    type EntitlementsPerSubscription,
    checkConditions,
    findSubscriptionsMatching,
    getEntitlementQuantityForMember,
    getTotalEntitlementQuantity,
    hasGrantedEntitlement,
    resolveEntitlementForMember,
    resolveGrantedEntitlement,
    resolveTotalEntitlement,
} from './helpers';
import type {
    BoundEntitlementChecks,
    EntitlementCatalog,
    EntitlementChecksForOrgAndUser,
    EntitlementChecksForSelection,
    EntitlementResolveConditions,
    EntitlementResolverForOrgAndUser,
    EntitlementResolverForSelection,
    Entitlements,
    PlanSelectionForEntitlementChecks,
    ResolvedEntitlement,
} from './interface';

const isSubscriptionSelection = (selection: Subscription | PlanIDs): selection is Subscription =>
    'ID' in selection && typeof selection.ID === 'string';

const getSelectedPlanIDs = (selection: PlanSelectionForEntitlementChecks): PlanIDs => {
    if (selection === null || selection === undefined || isFreeSubscription(selection)) {
        return {};
    }

    if (typeof selection === 'string') {
        return isValidPlanName(selection) ? { [selection]: 1 } : {};
    }

    if (isSubscriptionSelection(selection)) {
        return getPlanIDs(selection);
    }

    return selection;
};

/**
 * Applies every check in a registry to one resolver, keeping each check's own return type per key.
 */
const bindEntitlementChecks = <TResolver, TRegistry extends Record<string, (resolver: TResolver) => unknown>>(
    registry: TRegistry,
    resolver: TResolver
): BoundEntitlementChecks<TRegistry> =>
    Object.fromEntries(
        Object.entries(registry).map(([name, check]) => [name, check(resolver)])
    ) as BoundEntitlementChecks<TRegistry>;

/**
 * Wraps entitlements so callers can use the convenient named checks defined in {@link entitlementChecksForSelection}.
 * At the same time gives access to the entitlement resolver functions.
 *
 * Unlike {@link createEntitlementResolverForOrgAndUser}, lets callers do entitlement checks relevant for the selection
 * (specific subscription, PlanIDs, plan name). The checks are done against the generic entitlements catalog (which is
 * exactly the same for all users). While it's irreplaceable for some cases (like when you need to know what
 * entitlements the specific plan or subscription gives you), it unfortunately doesn't have absolute precision as the
 * individual entitlements for orgs and users might vary.
 *
 * Prefer {@link createEntitlementResolverForOrgAndUser} instead of {@link createEntitlementResolverForSelection}
 * whenever possible: for questions about what the current user or organization has, the org/user resolver is the
 * stronger and more precise source; reserve the selection resolver for plan-only questions.
 *
 * @example
 * const resolver = createEntitlementResolverForSelection(entitlementCatalog, PLANS.MAIL_PRO);
 * if (resolver.hasVpn) { ... }
 * const maxSpace = resolver.quantityTotal(EntitlementName.MaxSpace);
 *
 * Please note that there is a method {@link EntitlementResolverForOrgAndUser.withSelection} which can be used from
 * {@link useEntitlementChecksForOrgAndUser}.
 */
export const createEntitlementResolverForSelection = (
    entitlementCatalog: EntitlementCatalog | undefined,
    selection: PlanSelectionForEntitlementChecks
): EntitlementChecksForSelection => {
    const planIDs = getSelectedPlanIDs(selection);

    const resolvedEntitlementsPerPlan = getEntitlementsPerPlan(entitlementCatalog, planIDs);

    const hasMatchingSubscription = (conditions: EntitlementResolveConditions) =>
        checkConditions(conditions, resolvedEntitlementsPerPlan);

    const resolveTotal = (name: EntitlementName): ResolvedEntitlement =>
        resolveGrantedEntitlement(resolvedEntitlementsPerPlan, name);
    const quantityTotal = (name: EntitlementName) => resolveTotal(name).quantity;

    // Not routed through hasMatchingSubscription: the folded catalog entry carries the merged amount, and a
    // quantity of 0 means the entitlement is not granted even though the name is present.
    const hasEntitlement = (name: EntitlementName) => hasGrantedEntitlement(resolvedEntitlementsPerPlan, name);

    const resolver: EntitlementResolverForSelection = {
        hasMatchingSubscription,
        hasEntitlement,
        resolveTotal,
        quantityTotal,
    };

    return { ...resolver, ...bindEntitlementChecks(entitlementChecksForSelection, resolver) };
};

const normalizeSubscriptionsInput = (subscriptions: Subscription[] | MaybeFreeSubscription): Subscription[] => {
    if (Array.isArray(subscriptions)) {
        return subscriptions;
    }

    const subscription = subscriptions;
    if (!isPaidSubscription(subscription)) {
        return [];
    }

    return getSubscriptionsArray(subscription);
};

/**
 * Wraps entitlements so callers can use the convenient named checks defined in {@link entitlementChecksForOrgAndUser}.
 * At the same time gives access to the entitlement resolver functions.
 *
 * Unlike {@link createEntitlementResolverForSelection}, lets callers do entitlement checks relevant for the current org
 * and user. These checks are more precise than the comparison against the entitlements catalog done by
 * {@link createEntitlementResolverForSelection}.
 *
 * Prefer {@link createEntitlementResolverForOrgAndUser} instead of {@link createEntitlementResolverForSelection}
 * whenever possible.
 *
 * @example
 * const resolver = createEntitlementResolverForOrgAndUser(entitlementCatalog, entitlements, [subscription]);
 * const isBusiness = resolver.isBusiness;
 * const memberSpace = resolver.quantityForMember(EntitlementName.MaxSpace);
 */
export const createEntitlementResolverForOrgAndUser = (
    entitlementCatalog: EntitlementCatalog | undefined,
    entitlements: Entitlements | undefined,
    subscriptions: Subscription[] | MaybeFreeSubscription
): EntitlementChecksForOrgAndUser => {
    const subscriptionsArray = normalizeSubscriptionsInput(subscriptions);

    const resolvedEntitlementsPerSubscription: EntitlementsPerSubscription = subscriptionsArray.map((subscription) => {
        const entitlements = getEntitlementsPerSubscription(entitlementCatalog, subscription);
        return { subscription, entitlements };
    });

    const quantityTotal = (name: EntitlementName) => getTotalEntitlementQuantity(entitlements, name);

    /**
     * The checks in {@link entitlementChecksForSelection} are shared: {@link entitlementChecksForOrgAndUser} spreads
     * them in, and each registry is attached to the resolver instance created by its respective factory. A check is
     * therefore declared once (against the weak contract of {@link EntitlementResolverForSelection}, which is all a
     * check author is allowed to rely on) but can run against two different resolver instances: this one, or the one
     * from {@link createEntitlementResolverForSelection}.
     *
     * The point of this polymorphism is that the same check automatically gets the strongest answer available. When it
     * runs through {@link entitlementChecksForOrgAndUser}, it receives this resolver, whose `hasEntitlement` is backed
     * by the actual org entitlements. When it runs through {@link entitlementChecksForSelection}, it receives the
     * catalog-backed resolver, whose `hasEntitlement` is weaker. The upgrade is free for the check author: declare a
     * check once against the weak methods, and it behaves stronger wherever a stronger instance is passed in.
     *
     * Which methods are actually stronger depends on the method. `hasEntitlement`, `resolveTotal` and
     * `quantityTotal` in this resolver are strictly stronger than in the selection resolver: they report what the
     * backend actually granted this organization, whereas the selection resolver can only report the nominal amount
     * the chosen plans advertise. `hasMatchingSubscription`, however, evaluates the include/exclude conditions against
     * the catalog in both implementations — the backend API for org/user entitlements isn't expressive enough to answer
     * such conditions, so both are only approximations; they merely differ in scope (all of the user's subscriptions
     * here, one given selection there).
     *
     * The object below is what makes this work: it is this resolver's implementation of the weak
     * `EntitlementResolverForSelection` contract — the type restricts what a check may call, but the instance itself
     * still answers as strongly as this resolver can.
     */
    const resolverForSelection: EntitlementResolverForSelection = {
        hasMatchingSubscription: (conditions) =>
            findSubscriptionsMatching(conditions, resolvedEntitlementsPerSubscription).result,
        hasEntitlement: (name) => quantityTotal(name) > 0,
        resolveTotal: (name) => resolveTotalEntitlement(entitlements, name),
        quantityTotal,
    };

    const resolver: EntitlementResolverForOrgAndUser = {
        resolveForMember: (name) => resolveEntitlementForMember(entitlements, name),
        quantityForMember: (name) => getEntitlementQuantityForMember(entitlements, name),
        findSubscriptionsMatching: (conditions) =>
            findSubscriptionsMatching(conditions, resolvedEntitlementsPerSubscription),
        withSelection: (selection: PlanSelectionForEntitlementChecks) =>
            createEntitlementResolverForSelection(entitlementCatalog, selection),

        ...resolverForSelection,
    };

    return { ...resolver, ...bindEntitlementChecks(entitlementChecksForOrgAndUser, resolver) };
};
