import { PLANS } from '@proton/payments/core/constants';
import { sizeUnits } from '@proton/shared/lib/helpers/size';
import type { Organization } from '@proton/shared/lib/interfaces/Organization';
import { getOrganizationDenomination } from '@proton/shared/lib/organization/helper';
import clamp from '@proton/utils/clamp';

export const getTotalStorage = (
    { UsedSpace: memberUsedSpace = 0, MaxSpace: memberMaxSpace = 0 } = {},
    { MaxSpace: organizationMaxSpace = 0, AssignedSpace: organizationAssignedSpace = 0 } = {}
) => {
    return {
        memberUsedSpace: memberUsedSpace,
        organizationUsedSpace: organizationAssignedSpace - memberMaxSpace,
        organizationMaxSpace: organizationMaxSpace,
    };
};

const getDefaultInitialStorage = (organization: Organization | undefined) => {
    const isFamilyOrg = getOrganizationDenomination(organization) === 'familyGroup';
    if (organization?.PlanName === PLANS.PASS_FAMILY) {
        return 2.5 * sizeUnits.GB;
    }
    if (isFamilyOrg || organization?.PlanName === PLANS.VISIONARY) {
        return 500 * sizeUnits.GB;
    }
    if ([PLANS.DRIVE_PRO, PLANS.DRIVE_BUSINESS].includes(organization?.PlanName as any)) {
        return sizeUnits.TB;
    }
    return 5 * sizeUnits.GB;
};

export const getInitialStorage = (
    organization: Organization | undefined,
    storageRange: {
        min: number;
        max: number;
    }
) => {
    const result = getDefaultInitialStorage(organization);
    if (result <= storageRange.max) {
        return result;
    }
    return 5 * sizeUnits.GB;
};

export const getStorageRange = (
    { UsedSpace: memberUsedSpace = 0, MaxSpace: memberMaxSpace = 0 } = {},
    { MaxSpace: organizationMaxSpace = 0, AssignedSpace: organizationAssignedSpace = 0 } = {}
) => {
    return {
        min: memberUsedSpace,
        // If more space is assigned than the organization has (e.g. after a downgrade), only allow reducing
        max: Math.max(organizationMaxSpace - organizationAssignedSpace, 0) + memberMaxSpace,
    };
};

const PASS_B2B_SEAT_STORAGE = 10 * sizeUnits.GB;

export const getPassB2BAdminStorage = (
    selfMember: Parameters<typeof getStorageRange>[0],
    organization: Parameters<typeof getStorageRange>[1]
) => {
    const { min, max } = getStorageRange(selfMember, organization);
    return clamp(PASS_B2B_SEAT_STORAGE, min, max);
};

// Pass B2B only lowers the admin's allocation, to free storage for the members.
// An admin already at or below the target keeps their allocation and is never raised.
export const isAdminStorageReduction = (selfMember: Parameters<typeof getStorageRange>[0], storage: number) => {
    return storage < (selfMember?.MaxSpace ?? 0);
};
