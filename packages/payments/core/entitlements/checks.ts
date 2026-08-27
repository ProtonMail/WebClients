import { EntitlementName } from './entitlement-names';
import type { EntitlementCheck } from './interface';

/**
 * Registry of popular, named entitlement checks, exposed on `resolver.checks`. Add checks here instead of resolving
 * entitlements by hand.
 */
export const entitlementChecks = {
    orgIsBusiness: (r) => !!r.quantityOrg(EntitlementName.Business),
    orgHasVpn: (r) => !!r.quantityOrg(EntitlementName.FlagsVpn),
    orgHasSentinel: (r) => !!r.quantityOrg(EntitlementName.Sentinel),
    orgHasLumo: (r) => !!r.quantityOrg(EntitlementName.FlagsLumo),
    orgHasPassActivityMonitor: (r) => !!r.quantityOrg(EntitlementName.ActivityMonitorPass),
    orgHasVpnActivityMonitor: (r) => !!r.quantityOrg(EntitlementName.ActivityMonitorVpn),
    orgHasSubsidiaries: (r) => !!r.quantityOrg(EntitlementName.MaxSubsidiaries),
    orgHasMembersSubsidiaries: (r) => !!r.quantityOrg(EntitlementName.MaxMembersSubsidiaries),
    orgHasAdminRoles: (r) => !!r.quantityOrg(EntitlementName.AdminRoles),
    orgIsMultiUser: (r) => !!r.quantityOrg(EntitlementName.MultiUser),
    /** MSP is exclusively available for Pass Business orgs that can create and staff subsidiaries. */
    orgIsMspEligible: (r) =>
        !!r.quantity(EntitlementName.PassBusiness) &&
        !!r.quantityOrg(EntitlementName.MaxSubsidiaries) &&
        !!r.quantityOrg(EntitlementName.MaxMembersSubsidiaries),
} satisfies Record<string, EntitlementCheck>;
