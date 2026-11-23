import { sizeUnits } from '@proton/shared/lib/helpers/size';

import { getPassB2BAdminStorage, isAdminStorageReduction } from './storage';

const GB = sizeUnits.GB;

describe('getPassB2BAdminStorage', () => {
    it('gives the admin 10GB when the admin holds all of a larger organization storage', () => {
        const selfMember = { UsedSpace: 1 * GB, MaxSpace: 30 * GB };
        const organization = { MaxSpace: 30 * GB, AssignedSpace: 30 * GB };

        expect(getPassB2BAdminStorage(selfMember, organization)).toBe(10 * GB);
    });

    it('never goes below the storage the admin already uses', () => {
        const selfMember = { UsedSpace: 15 * GB, MaxSpace: 30 * GB };
        const organization = { MaxSpace: 30 * GB, AssignedSpace: 30 * GB };

        expect(getPassB2BAdminStorage(selfMember, organization)).toBe(15 * GB);
    });

    it('never goes above the storage available to the admin', () => {
        const selfMember = { UsedSpace: 1 * GB, MaxSpace: 5 * GB };
        const organization = { MaxSpace: 5 * GB, AssignedSpace: 5 * GB };

        expect(getPassB2BAdminStorage(selfMember, organization)).toBe(5 * GB);
    });
});

describe('isAdminStorageReduction', () => {
    it('is true when the target is below the admin allocation', () => {
        expect(isAdminStorageReduction({ MaxSpace: 30 * GB }, 10 * GB)).toBe(true);
    });

    it('is false when the admin already has exactly the target', () => {
        expect(isAdminStorageReduction({ MaxSpace: 10 * GB }, 10 * GB)).toBe(false);
    });

    it('is false when the admin has less than the target', () => {
        expect(isAdminStorageReduction({ MaxSpace: 5 * GB }, 10 * GB)).toBe(false);
    });

    it('is false when the admin member is missing', () => {
        expect(isAdminStorageReduction(undefined, 10 * GB)).toBe(false);
    });
});
