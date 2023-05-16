import { hasOrganizationSetup, hasOrganizationSetupWithKeys } from '@proton/shared/lib/helpers/organization';
import { Organization } from '@proton/shared/lib/interfaces';

describe('hasOrganizationSetup', () => {
    it('Should return false when RequiresKey not set', () => {
        const testOrg: Partial<Organization> = {};
        expect(hasOrganizationSetup(testOrg)).toBe(false);
    });

    it('Should return false when RequiresKey is 0 and no name', () => {
        const testOrg: Partial<Organization> = {
            RequiresKey: 0,
        };
        expect(hasOrganizationSetup(testOrg)).toBe(false);
    });

    it('Should return true when RequiresKey is not set and name', () => {
        const testOrg: Partial<Organization> = {
            Name: 'Test',
        };
        expect(hasOrganizationSetup(testOrg)).toBe(true);
    });

    it('Should return false when RequiresKey is 1 and no name', () => {
        const testOrg: Partial<Organization> = {
            RequiresKey: 1,
        };
        expect(hasOrganizationSetup(testOrg)).toBe(false);
    });

    it('Should return true when RequiresKey is 0 and name', () => {
        const testOrg: Partial<Organization> = {
            RequiresKey: 0,
            Name: 'Test',
        };
        expect(hasOrganizationSetup(testOrg)).toBe(true);
    });

    it('Should return false when RequiresKey is 1 and name', () => {
        const testOrg: Partial<Organization> = {
            RequiresKey: 1,
            Name: 'Test',
        };
        expect(hasOrganizationSetup(testOrg)).toBe(false);
    });
});

describe('hasOrganizationSetupWithKeys', () => {
    it('Should return false when RequiresKey not set', () => {
        const testOrg: Partial<Organization> = {};
        expect(hasOrganizationSetupWithKeys(testOrg)).toBe(false);
    });

    it('Should return false when RequiresKey set and HasKeys not set', () => {
        const testOrg: Partial<Organization> = {
            RequiresKey: 1,
        };
        expect(hasOrganizationSetupWithKeys(testOrg)).toBe(false);
    });

    it('Should return false when RequiresKey not set and HasKeys set', () => {
        const testOrg: Partial<Organization> = {
            HasKeys: 1,
        };
        expect(hasOrganizationSetupWithKeys(testOrg)).toBe(false);
    });

    it('Should return false when RequiresKey is 0 and no HasKeys', () => {
        const testOrg: Partial<Organization> = {
            RequiresKey: 0,
            HasKeys: 0,
        };
        expect(hasOrganizationSetupWithKeys(testOrg)).toBe(false);
    });

    it('Should return false when RequiresKey is 1 and no HasKeys', () => {
        const testOrg: Partial<Organization> = {
            RequiresKey: 1,
            HasKeys: 0,
        };
        expect(hasOrganizationSetupWithKeys(testOrg)).toBe(false);
    });

    it('Should return false when RequiresKey is 0 and HasKeys', () => {
        const testOrg: Partial<Organization> = {
            RequiresKey: 0,
            HasKeys: 1,
        };
        expect(hasOrganizationSetupWithKeys(testOrg)).toBe(false);
    });

    it('Should return true when RequiresKey is 1 and HasKeys', () => {
        const testOrg: Partial<Organization> = {
            RequiresKey: 1,
            HasKeys: 1,
        };
        expect(hasOrganizationSetupWithKeys(testOrg)).toBe(true);
    });
});
