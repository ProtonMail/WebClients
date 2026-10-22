import { buildUser } from '@proton/account/testing/buildUser';
import type { OrganizationExtended } from '@proton/shared/lib/interfaces/Organization';

import { isB2BAdmin } from './isB2BAdmin';

const organization = { Name: 'Example organization' } as OrganizationExtended;

describe('isB2BAdmin', () => {
    it('is true for an admin of a VPN business organization', () => {
        expect(isB2BAdmin({ user: buildUser(), organization, isVpnB2B: true })).toBe(true);
    });

    it('is false for an admin of an organization without VPN business', () => {
        expect(isB2BAdmin({ user: buildUser(), organization, isVpnB2B: false })).toBe(false);
    });

    it('is false for a member', () => {
        const user = buildUser({ isAdmin: false, isMember: true });

        expect(isB2BAdmin({ user, organization, isVpnB2B: true })).toBe(false);
    });

    it('is false for an admin signed in to another account', () => {
        const user = buildUser({ isSelf: false });

        expect(isB2BAdmin({ user, organization, isVpnB2B: true })).toBe(false);
    });

    it('is false without an organization', () => {
        expect(isB2BAdmin({ user: buildUser(), organization: undefined, isVpnB2B: true })).toBe(false);
    });
});
