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
 * Describes how an entitlement quantity is distributed across an organization.
 *
 * - `Global`      — A single org-level value (OrganizationEntitlements). All Switch entitlements
 *                   and org-wide Quantity entitlements (e.g. max-revision-days) use this scope.
 * - `Distributed` — The org total is split across members (MemberEntitlements). Each member
 *                   receives an individual allocation (e.g. max-space, max-vpn).
 */
export enum EntitlementScope {
    Global = 0,
    Distributed = 1,
}

export interface ResolvedEntitlement {
    name: EntitlementName;
    quantity: number;
    scope: EntitlementScope;
}

/**
 * @internal - prefer using the EntitlementChecks type instead.
 *
 * Queries a loaded set of entitlements by name.
 *
 * An organization has one or more members, and an admin can allocate certain entitlements
 * (e.g. storage) to individual members. Plain queries (`resolve`/`quantity`) return what
 * the current member gets; the `*Org` queries return what the whole organization is granted.
 * Prefer the plain queries in UI unless you specifically need the organization total.
 *
 */
export interface EntitlementResolverInternal {
    /** What the current member gets for this entitlement. */
    resolve: (name: EntitlementName) => ResolvedEntitlement;
    /** What the whole organization is granted for this entitlement. */
    resolveOrg: (name: EntitlementName) => ResolvedEntitlement;
    /** Amount the current member gets; 0 when none. */
    quantity: (name: EntitlementName) => number;
    /** Amount granted to the whole organization; 0 when none. */
    quantityOrg: (name: EntitlementName) => number;
}

/**
 * A named, reusable entitlement check (e.g. `isBusiness`). It only receives the core resolver,
 * so it can never read raw entitlements itself and therefore stays consistent with how
 * entitlements are resolved everywhere else. Register checks in `entitlementChecks`.
 */
export type EntitlementCheck<TResult = unknown> = (resolver: EntitlementResolverInternal) => TResult;
