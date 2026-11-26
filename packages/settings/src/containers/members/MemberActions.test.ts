import { APPS, MEMBER_PRIVATE } from '@proton/shared/lib/constants';
import type { Member } from '@proton/shared/lib/interfaces/Member';
import { MEMBER_STATE } from '@proton/shared/lib/interfaces/Member';
import type { Organization } from '@proton/shared/lib/interfaces/Organization';
import type { CachedOrganizationKey } from '@proton/shared/lib/interfaces/OrganizationKey';
import type { UserModel } from '@proton/shared/lib/interfaces/User';

import { getMemberPermissions } from './MemberActions';

const getPermissions = ({ impersonationDisabled }: { impersonationDisabled: boolean }) =>
    getMemberPermissions({
        permissions: null,
        appName: APPS.PROTONACCOUNT,
        user: { isSelf: true } as UserModel,
        member: {
            Self: 0,
            State: MEMBER_STATE.STATUS_ENABLED,
            Private: MEMBER_PRIVATE.READABLE,
            PublicKey: 'public-key',
            SSO: 0,
        } as Member,
        addresses: [{ ID: 'address-id', Email: 'member@example.com' }] as Parameters<
            typeof getMemberPermissions
        >[0]['addresses'],
        organization: { RequiresKey: 1, HasKeys: 1 } as Organization,
        organizationKey: { privateKey: {} } as CachedOrganizationKey,
        disableMemberSignIn: false,
        impersonationDisabled,
        backupPasswordDisabled: false,
        ssoDomainsSet: new Set(),
        isOwner: true,
    });

describe('getMemberPermissions', () => {
    it('allows signing in as and changing the password of a non-private member', () => {
        const { canLogin, canChangePassword } = getPermissions({ impersonationDisabled: false });

        expect(canLogin).toBe(true);
        expect(canChangePassword).toBe(true);
    });

    it('hides signing in as and changing the password when the organization disabled impersonation', () => {
        const { canLogin, canChangePassword } = getPermissions({ impersonationDisabled: true });

        expect(canLogin).toBe(false);
        expect(canChangePassword).toBe(false);
    });
});
