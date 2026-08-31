import type { Entitlement, Entitlements } from '../core/entitlements/interface';

export const makeEntitlements = (
    org: Entitlement[] = [],
    user: Entitlement[] = [],
    member: Entitlement[] = []
): Entitlements => ({
    OrganizationEntitlements: org,
    UserEntitlements: user,
    MemberEntitlements: member,
});
