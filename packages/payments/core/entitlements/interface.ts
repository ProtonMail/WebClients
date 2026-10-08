import type { ADDON_NAMES, PLANS } from '../constants';
import type { FreeSubscription, PlanIDs } from '../interface';
import type { Subscription } from '../subscription/interface';
import type { entitlementChecksForOrgAndUser, entitlementChecksForSelection } from './checks';
import type { EntitlementName } from './entitlement-names';

/**
 * 0 — Value — The entitlement has a numeric quantity (e.g. max-space: 500, max-vpn:10)
 * 1 — Switch — The entitlement is a boolean toggle, on or off (e.g. sentinel, catch-all, sso)
 */
export enum EntitlementType {
    Value = 0,
    Switch = 1,
}

export type Entitlement =
    | { Name: EntitlementName; Type: EntitlementType.Switch; Quantity: 0 | 1; Scope: EntitlementScope }
    | { Name: EntitlementName; Type: EntitlementType.Value; Quantity: number; Scope: EntitlementScope };

export interface Entitlements {
    UserEntitlements: Entitlement[];
    OrganizationEntitlements: Entitlement[];
    MemberEntitlements: Entitlement[];
}

/**
 * A single entitlement as it appears in the entitlement catalog (per plan/addon).
 *
 * This is the raw, plan-scoped definition of an entitlement. It is distinct from
 * {@link Entitlement}, which represents entitlements already resolved for a user/org.
 */
export interface EntitlementCatalogEntry {
    Name: EntitlementName;
    Type: EntitlementType;
    Quantity: number;
    Scope: EntitlementScope;
    MergeStrategy: EntitlementMergeStrategy;
}

/**
 * A plan (or addon) in the entitlement catalog, along with the entitlements it grants.
 */
export interface EntitlementCatalogPlan {
    Name: PLANS | ADDON_NAMES;
    Entitlements: EntitlementCatalogEntry[];
}

/**
 * The full entitlement catalog: the list of primary plans and addons, each with the
 * entitlements it grants.
 */
export interface EntitlementCatalog {
    Plans: EntitlementCatalogPlan[];
    Addons: EntitlementCatalogPlan[];
}

/**
 * Describes how an entitlement quantity is distributed across an organization.
 *
 * Mirrors the backend `EntitlementScope` enum (see Slim-API
 * `bundles/EntitlementBundle/src/Domain/Entitlement/EntitlementScope.php`).
 *
 * - `Organization`      — A single org-level value (OrganizationEntitlements), e.g. max-domains.
 *                         All Switch entitlements and org-wide Value entitlements (e.g.
 *                         max-revision-days) use this scope.
 * - `MemberAssignable`  — The org total is split across members (MemberEntitlements). Each
 *                         member receives an individual allocation (e.g. max-space).
 * - `Member`            — The value is defined globally for all members and distributed evenly.
 *                         It does not appear in MemberEntitlements by default, but can be
 *                         overridden per member (e.g. max-vpn, max-emergency-access-contacts).
 */
export enum EntitlementScope {
    Organization = 0,
    MemberAssignable = 1,
    Member = 2,
}

export enum EntitlementMergeStrategy {
    Sum = 0,
    Max = 1,
}

export interface EntitlementResolveConditions {
    includes: EntitlementName[];
    excludes?: EntitlementName[];
}

export interface EntitlementResolverForSelection {
    /**
     * Checks if current plan selection has all the given entitlements. In case of EntitlementResolverForOrgAndUser,
     * checks if there is a single subscription that has all the given entitlements.
     */
    hasMatchingSubscription: (conditions: EntitlementResolveConditions) => boolean;

    /**
     * Checks if current plan selection has the given entitlement. In case of EntitlementResolverForOrgAndUser, checks
     * if user/org has the given entitlements.
     */
    hasEntitlement: (entitlement: EntitlementName) => boolean;

    /**
     * Everything that is granted for this entitlement, before any split across members.
     *
     * A quantity of 0 means the entitlement is not granted at all: a Switch entitlement is
     * literally off, and a Value entitlement of 0 is nothing. `hasEntitlement` and the
     * include/exclude conditions agree with that reading.
     */
    resolveTotal: (name: EntitlementName) => ResolvedEntitlement;

    /** Same as {@link resolveTotal}, as a bare number; 0 when not granted. */
    quantityTotal: (name: EntitlementName) => number;
}

export interface ResolvedEntitlement {
    name: EntitlementName;
    quantity: number;
    scope: EntitlementScope;
}

export interface SubscriptionsMatchingEntitlements {
    result: boolean;
    subscriptions: Subscription[];
}

/**
 * Prefer using the EntitlementChecksForOrgAndUser type instead.
 *
 * Queries a loaded set of entitlements by name.
 *
 * An organization has one or more members, and an admin can allocate certain entitlements
 * (e.g. storage) to individual members. The `*ForMember` queries return what the current member
 * gets; the inherited `*Total` queries return what the whole organization is granted. Prefer the
 * per-member queries in UI unless you specifically need the organization total.
 *
 * The organization total is not attributable to a single subscription: the backend returns one
 * flat aggregate for the whole org, so there is no way to ask what one subscription contributes.
 *
 */
export interface EntitlementResolverForOrgAndUser extends EntitlementResolverForSelection {
    /** What the current member gets for this entitlement, after the admin's allocation. */
    resolveForMember: (name: EntitlementName) => ResolvedEntitlement;
    /** Amount the current member gets; 0 when none. */
    quantityForMember: (name: EntitlementName) => number;

    /**
     * Check if the organization has all the given entitlements for any of the subscriptions. For example, if
     * organization has two subscriptions:
     *   subscription A with [business, vpn]
     *   subscription B with [mail]
     *
     * Then:
     *   findSubscriptionsMatching({ includes: [business, vpn] }).result returns true;
     *   findSubscriptionsMatching({ includes: [mail] }).result returns true;
     *   findSubscriptionsMatching({ includes: [business, mail] }).result returns false.
     **/
    findSubscriptionsMatching: (conditions: EntitlementResolveConditions) => SubscriptionsMatchingEntitlements;

    /**
     * Creates a new entitlement resolver for a specific plan selection (plan name, PlanIDs, subscription).
     *
     * The returned resolver answers against the generic entitlements catalog, not against what this organization or
     * user actually has. Keep using the resolver you called this on for org/user questions; use the returned one only
     * for plan questions.
     *
     * @example
     * const [entitlementChecks] = useEntitlementChecksForOrgAndUser();
     * const selectedPlanResolver = entitlementChecks.withSelection(selectedPlan);
     * if (entitlementChecks.hasVpn && !selectedPlanResolver.hasVpn) { showDowngradeHint(); }
     */
    withSelection: (selection: PlanSelectionForEntitlementChecks) => EntitlementChecksForSelection;
}

export type EntitlementCheckForSelection<TResult = unknown> = (resolver: EntitlementResolverForSelection) => TResult;

/**
 * A named, reusable entitlement check (e.g. `isBusiness`). It only receives the core resolver,
 * so it can never read raw entitlements itself and therefore stays consistent with how
 * entitlements are resolved everywhere else. Register checks in `entitlementChecksForOrgAndUser`
 * (or `entitlementChecksForSelection` for catalog-based selection checks).
 */
export type SingleEntitlementCheckForOrgAndUser<TResult = unknown> = (
    resolver: EntitlementResolverForOrgAndUser
) => TResult;

/**
 * A check registry (see {@link entitlementChecksForSelection}) turned into the resolved values it produces when every
 * check in it is applied to a resolver: `isBusiness: (r) => boolean` becomes `isBusiness: boolean`.
 *
 * The parameter is typed as `never` on purpose: it only has to accept any registry whose values are unary functions,
 * whatever resolver they ask for.
 */
export type BoundEntitlementChecks<TRegistry> = {
    [K in keyof TRegistry]: TRegistry[K] extends (resolver: never) => infer TResult ? TResult : never;
};

export type BoundEntitlementChecksForOrgAndUser = BoundEntitlementChecks<typeof entitlementChecksForOrgAndUser>;

export type BoundEntitlementChecksForSelection = BoundEntitlementChecks<typeof entitlementChecksForSelection>;

export type EntitlementChecksForOrgAndUser = EntitlementResolverForOrgAndUser & BoundEntitlementChecksForOrgAndUser;

export type EntitlementChecksForSelection = EntitlementResolverForSelection & BoundEntitlementChecksForSelection;

export type PlanSelectionForEntitlementChecks = Subscription | PlanIDs | PLANS | null | undefined | FreeSubscription;
