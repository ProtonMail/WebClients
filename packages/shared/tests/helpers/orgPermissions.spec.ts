import { USER_ROLES } from '../../lib/constants';
import { getCanUpdateBilling } from '../../lib/helpers/orgPermissions';
import type { User } from '../../lib/interfaces/User';
import { type OrgPermissions, PERMISSIONS, type Permission } from '../../lib/interfaces/UserPermission';

const buildPermissions = (granted: Permission[]): OrgPermissions =>
    Object.fromEntries(PERMISSIONS.map((permission) => [permission, granted.includes(permission)])) as OrgPermissions;

const admin = { Role: USER_ROLES.ADMIN_ROLE } as User;
const member = { Role: USER_ROLES.MEMBER_ROLE } as User;
const freeUser = { Role: USER_ROLES.FREE_ROLE } as User;

describe('getCanUpdateBilling', () => {
    it('allows an admin with the billing permission', () => {
        expect(getCanUpdateBilling(admin, buildPermissions(['payment.billing.update']))).toBe(true);
    });

    it('denies a User Admin, who has the admin role but no billing permission', () => {
        expect(getCanUpdateBilling(admin, buildPermissions(['account.user.read']))).toBe(false);
    });

    it('denies an admin without permissions', () => {
        expect(getCanUpdateBilling(admin, null)).toBe(false);
    });

    it('allows an admin whose permissions are all false right after a free-to-paid upgrade', () => {
        expect(getCanUpdateBilling(admin, buildPermissions([]))).toBe(true);
    });

    it('allows a member with the billing permission', () => {
        expect(getCanUpdateBilling(member, buildPermissions(['payment.billing.update']))).toBe(true);
    });

    it('denies a member without permissions', () => {
        expect(getCanUpdateBilling(member, buildPermissions([]))).toBe(false);
    });

    it('allows a free user without permissions', () => {
        expect(getCanUpdateBilling(freeUser, null)).toBe(true);
    });
});
