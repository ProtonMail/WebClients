import type { OrganizationExtended } from '@proton/shared/lib/interfaces/Organization';
import type { OrgPermissions } from '@proton/shared/lib/interfaces/UserPermission';

import { getBillingPageAvailability } from './getBillingPageAvailability';

type User = Parameters<typeof getBillingPageAvailability>[0]['user'];

const freeUser: User = { isAdmin: false, isFree: true, isMember: false, canPay: true };
const owner: User = { isAdmin: true, isFree: false, isMember: false, canPay: true };
const member: User = { isAdmin: false, isFree: false, isMember: true, canPay: false };

const noPermissions = {} as OrgPermissions;
const withPermissions = (permissions: Partial<OrgPermissions>) => permissions as OrgPermissions;

const getAvailability = ({
    user,
    permissions = noPermissions,
    organization,
}: {
    user: User;
    permissions?: OrgPermissions;
    organization?: Pick<OrganizationExtended, 'IsSubsidiary'>;
}) => getBillingPageAvailability({ user, organization, permissions });

describe('getBillingPageAvailability', () => {
    it('shows billing to a free user', () => {
        expect(getAvailability({ user: freeUser })).toEqual({ dashboard: true, billing: true });
    });

    it('shows billing to an owner with account.dashboard.read', () => {
        const permissions = withPermissions({ 'account.dashboard.read': true, 'account.user.read': true });
        expect(getAvailability({ user: owner, permissions })).toEqual({ dashboard: true, billing: true });
    });

    it('hides billing from a member', () => {
        expect(getAvailability({ user: member, permissions: withPermissions({ 'account.user.read': true }) })).toEqual({
            dashboard: false,
            billing: false,
        });
    });

    it('hides billing from an admin without account.dashboard.read', () => {
        const permissions = withPermissions({ 'account.dashboard.read': false, 'account.user.read': true });
        expect(getAvailability({ user: owner, permissions })).toEqual({ dashboard: false, billing: false });
    });

    it('shows billing to an admin whose permissions have not arrived yet', () => {
        expect(getAvailability({ user: owner })).toEqual({ dashboard: true, billing: true });
    });

    it('hides billing in a subsidiary organization', () => {
        const permissions = withPermissions({ 'account.dashboard.read': true });
        expect(getAvailability({ user: owner, permissions, organization: { IsSubsidiary: true } })).toEqual({
            dashboard: false,
            billing: false,
        });
        expect(getAvailability({ user: freeUser, organization: { IsSubsidiary: true } }).billing).toBe(false);
    });

    it('shows the dashboard but not billing to a reader who cannot pay', () => {
        const permissions = withPermissions({ 'account.dashboard.read': true });
        expect(getAvailability({ user: { ...member, isMember: false }, permissions })).toEqual({
            dashboard: true,
            billing: false,
        });
    });
});
