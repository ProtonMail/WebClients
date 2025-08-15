import { PLANS } from '@proton/payments';
import { sizeUnits } from '@proton/shared/lib/helpers/size';
import type { Organization } from '@proton/shared/lib/interfaces';
import { getOrganizationDenomination } from '@proton/shared/lib/organization/helper';

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
        max: organizationMaxSpace - organizationAssignedSpace + memberMaxSpace,
    };
};
