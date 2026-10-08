import { EntitlementName } from './entitlement-names';
import type { EntitlementCheckForSelection, SingleEntitlementCheckForOrgAndUser } from './interface';

/**
 * This group of checks is special, as they have double purpose. They can be used both for org/user and for specific
 * selection (subscription, PlanIDs, plan name). These checks are exposed both in the resolver for org/user and in the
 * resolver for selection.
 *
 * A check belongs here whenever it can be expressed with the weak contract ({@link EntitlementResolverForSelection}),
 * which is most of them. It then answers about the current organization when it runs on the org/user resolver, and
 * about the chosen plan or subscription when it runs on the selection resolver — so the same name works on a
 * plan-comparison screen and on the user's own dashboard.
 *
 * That is also why the names must not say "org": the subject depends on which resolver the check runs against.
 *
 *
 * ‼️‼️ IMPORTANT: semantic note! If you want to check that user has a plan that must include several entitlements then
 *  most likely you want to use {@link EntitlementResolverForSelection.hasMatchingSubscription}.
 *
 * There is a difference between
 *
 * r.hasMatchingSubscription({ includes: [EntitlementName.Business, EntitlementName.FlagsVpn] })
 *
 * and
 *
 * r.hasEntitlement(EntitlementName.Business) && r.hasEntitlement(EntitlementName.FlagsVpn)
 *
 * The first one will return true if user has any subscription that includes both entitlements, the second will return
 * true if user has 2 subscriptions: one that includes Business and one that includes FlagsVpn. ‼️‼️
 *
 * Two lint rules keep this registry the place where entitlement questions are phrased:
 * `custom-rules/no-single-entitlement-condition` sends single-name conditions to `hasEntitlement`, and
 * `custom-rules/no-boolean-entitlement-composition` sends combinations of two or more checks here.
 *
 * Prefer {@link entitlementChecksForOrgAndUser} instead of {@link entitlementChecksForSelection} whenever possible.
 */
export const entitlementChecksForSelection = {
    isB2cMultiUser: (r) =>
        r.hasMatchingSubscription({ includes: [EntitlementName.MultiUser], excludes: [EntitlementName.Business] }),

    isBusiness: (r) => r.hasEntitlement(EntitlementName.Business),

    isMultiUser: (r) => r.hasEntitlement(EntitlementName.MultiUser),

    hasVpn: (r) => r.hasEntitlement(EntitlementName.FlagsVpn),

    hasSentinel: (r) => r.hasEntitlement(EntitlementName.Sentinel),

    hasLumo: (r) => r.hasEntitlement(EntitlementName.FlagsLumo),

    hasPassActivityMonitor: (r) => r.hasEntitlement(EntitlementName.ActivityMonitorPass),

    hasVpnActivityMonitor: (r) => r.hasEntitlement(EntitlementName.ActivityMonitorVpn),

    hasSubsidiaries: (r) => r.hasEntitlement(EntitlementName.MaxSubsidiaries),

    hasMembersSubsidiaries: (r) => r.hasEntitlement(EntitlementName.MaxMembersSubsidiaries),

    hasAdminRoles: (r) => r.hasEntitlement(EntitlementName.AdminRoles),

    isVpnBusiness: (r) => r.hasMatchingSubscription({ includes: [EntitlementName.Business, EntitlementName.FlagsVpn] }),

    isVpnOrPassBusiness: (r) =>
        r.hasMatchingSubscription({ includes: [EntitlementName.Business, EntitlementName.FlagsVpn] }) ||
        r.hasMatchingSubscription({ includes: [EntitlementName.Business, EntitlementName.FlagsPass] }),

    hasMaxDedicatedIps: (r) => r.hasEntitlement(EntitlementName.MaxDedicatedIps),

    hasVpnLocationFilter: (r) => r.hasEntitlement(EntitlementName.VpnLocationFilter),

    hasGroups: (r) => r.hasEntitlement(EntitlementName.Groups),
} satisfies Record<string, EntitlementCheckForSelection>;

/**
 * Registry of popular, named entitlement checks, exposed on the entitlement resolver. Add checks here instead of
 * resolving entitlements by hand.
 *
 * Only add a check here when it genuinely needs the strong contract — the member-level `resolveForMember` /
 * `quantityForMember`, or `findSubscriptionsMatching` with its matching subscriptions. Everything answerable from
 * {@link EntitlementResolverForSelection} belongs in {@link entitlementChecksForSelection} instead, so that it also
 * works against a plan or a subscription.
 */
export const entitlementChecksForOrgAndUser = {
    ...entitlementChecksForSelection,

    isMspEligible: (r) =>
        r.quantityForMember(EntitlementName.PassBusiness) > 0 &&
        r.quantityTotal(EntitlementName.MaxSubsidiaries) > 0 &&
        r.quantityTotal(EntitlementName.MaxMembersSubsidiaries) > 0,
} satisfies Record<string, SingleEntitlementCheckForOrgAndUser>;
