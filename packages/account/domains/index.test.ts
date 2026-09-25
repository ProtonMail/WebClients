import type { ProtonThunkArguments } from '@proton/redux-shared-store-types';
import { getTestStore } from '@proton/redux-shared-store/test';
import { EVENT_ACTIONS, PRODUCT_BIT, USER_ROLES } from '@proton/shared/lib/constants';
import type { Domain, UserModel, UserPermission } from '@proton/shared/lib/interfaces';
import { formatUser } from '@proton/shared/lib/user/helpers';

import { getModelState } from '../tests';
import { getServerEvent } from '../tests/getServerEvent';
import { userReducer } from '../user';
import {
    getOrgPermissions,
    userPermissionsFulfilled,
    userPermissionsReducer,
    userPermissionsThunk,
} from '../userPermissions';
import { domainsReducer, domainsThunk, selectDomains } from './index';

const defaultUser = {
    Flags: {},
} as UserModel;

describe('domains', () => {
    const setup = ({
        user,
        userPermissions,
        isOwner = false,
    }: {
        user: UserModel;
        userPermissions?: UserPermission;
        isOwner?: boolean;
    }) => {
        const api = jest.fn(async () => {
            return { Domains: [{ ID: '1' }] };
        });
        const extraThunkArguments = { api } as unknown as ProtonThunkArguments;
        const { store } = getTestStore({
            reducer: { ...userReducer, ...userPermissionsReducer, ...domainsReducer },
            preloadedState: {
                // The user slice only ever stores formatUser() output, and the gate now depends on
                // isAdmin/isSelf via the AdminRoleMVP-off branch of userPermissions.
                user: getModelState(formatUser(user)),
                userPermissions: getModelState(
                    userPermissions && {
                        ...userPermissions,
                        permissions: getOrgPermissions(userPermissions.Permissions, isOwner),
                        role: user.Role,
                        // Preloaded cases stand in for API-provided permissions, i.e. AdminRoleMVP on.
                        // The legacy path is covered by the cases that let the real thunk run.
                        isLegacyPermissionModel: false,
                    }
                ),
            },
            extraThunkArguments,
        });
        return { store, api };
    };

    const getState = (value: any, type: any) => {
        return {
            ...getModelState(value),
            meta: {
                type,
            },
        };
    };

    it('should not fetch domains for a free user', async () => {
        const { store } = setup({ user: { ...defaultUser, Role: USER_ROLES.FREE_ROLE } });
        await store.dispatch(domainsThunk());
        expect(selectDomains(store.getState())).toMatchObject(getState([], 0));
    });

    it('should fetch domains for a legacy self-admin when AdminRoleMVP is off', async () => {
        const { store } = setup({
            user: {
                ...defaultUser,
                Role: USER_ROLES.ADMIN_ROLE,
                Subscribed: PRODUCT_BIT.VPN,
            },
        });
        await store.dispatch(domainsThunk());
        expect(selectDomains(store.getState())).toMatchObject(getState([{ ID: '1' }], 1));
        store.dispatch(
            getServerEvent({ Domains: [{ ID: '2', Domain: { ID: '2' } as Domain, Action: EVENT_ACTIONS.CREATE }] })
        );
        expect(selectDomains(store.getState())).toMatchObject(getState([{ ID: '1' }, { ID: '2' }], 1));
    });

    it('should fetch domains for a non-admin user with the sso_config.read or domain.read permission', async () => {
        const { store } = setup({
            user: { ...defaultUser, Role: USER_ROLES.MEMBER_ROLE },
            userPermissions: { Roles: [], Permissions: ['account.sso_config.read'], ShowAdminRolesUI: false },
        });
        await store.dispatch(domainsThunk());
        expect(selectDomains(store.getState())).toMatchObject(getState([{ ID: '1' }], 1));

        const { store: store2 } = setup({
            user: { ...defaultUser, Role: USER_ROLES.MEMBER_ROLE },
            userPermissions: { Roles: [], Permissions: ['account.domain.read'], ShowAdminRolesUI: false },
        });
        await store2.dispatch(domainsThunk());
        expect(selectDomains(store2.getState())).toMatchObject(getState([{ ID: '1' }], 1));
    });

    it('should not fetch domains for a non-admin user without the sso_config.read permission', async () => {
        const { store } = setup({
            user: { ...defaultUser, Role: USER_ROLES.MEMBER_ROLE },
            userPermissions: { Roles: [], Permissions: [], ShowAdminRolesUI: false },
        });
        await store.dispatch(domainsThunk());
        expect(selectDomains(store.getState())).toMatchObject(getState([], 0));
    });

    it('should clear domains once the refreshed permissions no longer allow reading them', async () => {
        const { store } = setup({
            user: {
                ...defaultUser,
                Role: USER_ROLES.ADMIN_ROLE,
                Subscribed: PRODUCT_BIT.MAIL,
            },
        });
        await store.dispatch(domainsThunk());
        expect(selectDomains(store.getState())).toMatchObject(getState([{ ID: '1' }], 1));
        store.dispatch(
            getServerEvent({ Domains: [{ ID: '2', Domain: { ID: '2' } as Domain, Action: EVENT_ACTIONS.CREATE }] })
        );
        expect(selectDomains(store.getState())).toMatchObject(getState([{ ID: '1' }, { ID: '2' }], 1));
        store.dispatch(getServerEvent({ User: { ...defaultUser, Subscribed: 0 } }));
        // The role change only invalidates userPermissions (clearState keeps its value), so the
        // list is reconciled when the refetched permissions land, not on the user event itself.
        expect(selectDomains(store.getState())).toMatchObject(getState([{ ID: '1' }, { ID: '2' }], 1));

        await store.dispatch(userPermissionsThunk());
        expect(selectDomains(store.getState())).toMatchObject(getState([], 0));
    });

    // Regression: the API reports Role 2 for a member invited to a group carrying a role, but the
    // permission set stays empty until the invite is accepted. The legacy isAdmin() gate made this
    // user issue GET /domains and get a 403 toast on every settings page.
    it('should not fetch domains for a pending group member with the admin role and no permissions', async () => {
        const { store, api } = setup({
            user: { ...defaultUser, Role: USER_ROLES.ADMIN_ROLE, Subscribed: PRODUCT_BIT.MAIL },
            userPermissions: { Roles: [], Permissions: [], ShowAdminRolesUI: false },
        });
        await store.dispatch(domainsThunk());
        expect(api).not.toHaveBeenCalled();
        expect(selectDomains(store.getState())).toMatchObject(getState([], 0));
    });

    // The owner role grants every permission through the resolved map, never through the raw list.
    it('should fetch domains for an org owner whose raw permission list is empty', async () => {
        const { store } = setup({
            user: { ...defaultUser, Role: USER_ROLES.ADMIN_ROLE, Subscribed: PRODUCT_BIT.MAIL },
            userPermissions: { Roles: [], Permissions: [], ShowAdminRolesUI: false },
            isOwner: true,
        });
        await store.dispatch(domainsThunk());
        expect(selectDomains(store.getState())).toMatchObject(getState([{ ID: '1' }], 1));
    });

    // Impersonation: a login-as-member sub-session has isSelf === false, so the synthesised
    // permission map denies it even for a Role 2 target. Restore the pre-flag behaviour, since such
    // a session could read domains before the permission gates existed.
    it('should fetch domains for an impersonated admin when AdminRoleMVP is off', async () => {
        const { store } = setup({
            user: {
                ...defaultUser,
                Role: USER_ROLES.ADMIN_ROLE,
                Subscribed: PRODUCT_BIT.MAIL,
                OrganizationPrivateKey: 'org-key',
            },
        });
        await store.dispatch(domainsThunk());
        expect(selectDomains(store.getState())).toMatchObject(getState([{ ID: '1' }], 1));
    });

    it('should not fetch domains for an impersonated admin when AdminRoleMVP is on', async () => {
        const { store, api } = setup({
            user: {
                ...defaultUser,
                Role: USER_ROLES.ADMIN_ROLE,
                Subscribed: PRODUCT_BIT.MAIL,
                OrganizationPrivateKey: 'org-key',
            },
            userPermissions: { Roles: [], Permissions: [], ShowAdminRolesUI: false },
        });
        await store.dispatch(domainsThunk());
        expect(api).not.toHaveBeenCalled();
        expect(selectDomains(store.getState())).toMatchObject(getState([], 0));
    });

    it('should invalidate the dummy cache when the domain read permission is granted', async () => {
        const { store } = setup({
            user: { ...defaultUser, Role: USER_ROLES.MEMBER_ROLE },
            userPermissions: { Roles: [], Permissions: [], ShowAdminRolesUI: false },
        });
        await store.dispatch(domainsThunk());
        expect(selectDomains(store.getState())).toMatchObject(getState([], 0));

        store.dispatch(
            userPermissionsFulfilled({
                Roles: [],
                Permissions: ['account.domain.read'],
                ShowAdminRolesUI: false,
                permissions: getOrgPermissions(['account.domain.read'], false),
                role: USER_ROLES.MEMBER_ROLE,
                isLegacyPermissionModel: false,
            })
        );
        expect(selectDomains(store.getState()).meta.fetchedAt).toBe(0);

        await store.dispatch(domainsThunk());
        expect(selectDomains(store.getState())).toMatchObject(getState([{ ID: '1' }], 1));
    });
});
