import type { ProtonThunkArguments } from '@proton/redux-shared-store-types';
import { getTestStore } from '@proton/redux-shared-store/test';
import { USER_ROLES } from '@proton/shared/lib/constants';
import type { Permission, UserModel } from '@proton/shared/lib/interfaces';
import { formatUser } from '@proton/shared/lib/user/helpers';

import { addressesReducer } from '../addresses';
import { getModelState } from '../tests';
import { userReducer } from '../user';
import { userPermissionsReducer } from '../userPermissions';
import { membersReducer, membersThunk, selectMembers } from './index';

const defaultUser = { Flags: {} } as UserModel;

// Mirrors the private ValueType enum in ./index (dummy = free/unprivileged cache, complete = fetched list).
const ValueType = { dummy: 0, complete: 1 } as const;

const setup = ({
    user,
    permissions,
    adminRoleMVP,
}: {
    user: UserModel;
    permissions: Permission[];
    adminRoleMVP: boolean;
}) => {
    const api = jest.fn(async (config: any) => {
        if (config?.url === 'core/v4/members') {
            return { Members: [{ ID: 'm1' }], Total: 1 };
        }
        return { Roles: [], Permissions: permissions, ShowAdminRolesUI: false };
    });
    const extraThunkArguments = {
        api,
        unleashClient: { isEnabled: (flag: string) => flag === 'AdminRoleMVP' && adminRoleMVP },
    } as unknown as ProtonThunkArguments;

    const { store } = getTestStore({
        reducer: { ...userReducer, ...userPermissionsReducer, ...addressesReducer, ...membersReducer },
        preloadedState: {
            // The user slice only ever stores formatUser() output, and the gate depends on
            // isAdmin/isSelf via the AdminRoleMVP-off branch of userPermissions.
            user: getModelState(formatUser(user)),
            addresses: getModelState([]),
        },
        extraThunkArguments,
    });

    const memberRequests = () => api.mock.calls.filter(([config]: any[]) => config?.url === 'core/v4/members');
    return { store, memberRequests };
};

describe('members fetch gate', () => {
    // Regression: the API reports Role 2 for a member invited to a group carrying a role, but the
    // permission set stays empty until the invite is accepted. The legacy isAdmin() gate made this
    // user issue GET /core/v4/members and get a 403 toast on every settings page.
    it('does not fetch members for a pending group member with the admin role and no permissions', async () => {
        const { store, memberRequests } = setup({
            user: { ...defaultUser, Role: USER_ROLES.ADMIN_ROLE },
            permissions: [],
            adminRoleMVP: true,
        });

        await store.dispatch(membersThunk());

        expect(memberRequests()).toHaveLength(0);
        expect(selectMembers(store.getState()).value).toEqual([]);
        expect(selectMembers(store.getState()).meta?.type).toBe(ValueType.dummy);
    });

    it('fetches members for a role-based admin with account.user.read', async () => {
        const { store, memberRequests } = setup({
            user: { ...defaultUser, Role: USER_ROLES.MEMBER_ROLE },
            permissions: ['account.user.read'],
            adminRoleMVP: true,
        });

        await store.dispatch(membersThunk());

        expect(memberRequests()).toHaveLength(1);
        expect(selectMembers(store.getState()).value).toMatchObject([{ ID: 'm1' }]);
    });

    it('fetches members for a legacy self-admin when AdminRoleMVP is off', async () => {
        const { store, memberRequests } = setup({
            user: { ...defaultUser, Role: USER_ROLES.ADMIN_ROLE },
            permissions: [],
            adminRoleMVP: false,
        });

        await store.dispatch(membersThunk());

        expect(memberRequests()).toHaveLength(1);
    });

    // Impersonation: a login-as-member sub-session has isSelf === false, so the synthesised
    // permission map denies it. Such a session could read members before the permission gates
    // existed, and /mail/identity-addresses still depends on it (an empty list leaves
    // AddressesWithMembers stuck on memberIndex === -1, i.e. a permanent spinner).
    it('fetches members for an impersonated admin when AdminRoleMVP is off', async () => {
        const { store, memberRequests } = setup({
            user: { ...defaultUser, Role: USER_ROLES.ADMIN_ROLE, OrganizationPrivateKey: 'org-key' },
            permissions: [],
            adminRoleMVP: false,
        });

        await store.dispatch(membersThunk());

        expect(memberRequests()).toHaveLength(1);
    });

    it('does not fetch members for an impersonated admin when AdminRoleMVP is on', async () => {
        const { store, memberRequests } = setup({
            user: { ...defaultUser, Role: USER_ROLES.ADMIN_ROLE, OrganizationPrivateKey: 'org-key' },
            permissions: [],
            adminRoleMVP: true,
        });

        await store.dispatch(membersThunk());

        expect(memberRequests()).toHaveLength(0);
    });

    it('does not fetch members for a plain member when AdminRoleMVP is off', async () => {
        const { store, memberRequests } = setup({
            user: { ...defaultUser, Role: USER_ROLES.MEMBER_ROLE },
            permissions: [],
            adminRoleMVP: false,
        });

        await store.dispatch(membersThunk());

        expect(memberRequests()).toHaveLength(0);
    });
});
