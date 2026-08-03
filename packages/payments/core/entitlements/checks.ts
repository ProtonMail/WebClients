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
    orgHasSubsidiaries: (r) => !!r.quantityOrg(EntitlementName.MaxSubsidiaries),
    orgHasMembersSubsidiaries: (r) => !!r.quantityOrg(EntitlementName.MaxMembersSubsidiaries),
    orgHasAdminRoles: (r) => !!r.quantityOrg(EntitlementName.AdminRoles),
} satisfies Record<string, EntitlementCheck>;
