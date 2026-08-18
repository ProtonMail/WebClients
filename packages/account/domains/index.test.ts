import { waitFor } from '@testing-library/react';

import type { ProtonThunkArguments } from '@proton/redux-shared-store-types';
import { getTestStore } from '@proton/redux-shared-store/test';
import { EVENT_ACTIONS, PRODUCT_BIT, USER_ROLES } from '@proton/shared/lib/constants';
import type { Domain, UserModel, UserPermission } from '@proton/shared/lib/interfaces';

import { getModelState } from '../test';
import { getServerEvent } from '../test/getServerEvent';
import { userReducer } from '../user';
import { getOrgPermissions, userPermissionsReducer } from '../userPermissions';
import { domainsReducer, domainsThunk, selectDomains } from './index';

const defaultUser = {
    Flags: {},
} as UserModel;

describe('domains', () => {
    const setup = ({ user, userPermissions }: { user: UserModel; userPermissions?: UserPermission }) => {
        const extraThunkArguments = {
            api: async () => {
                return { Domains: [{ ID: '1' }] };
            },
        } as unknown as ProtonThunkArguments;
        return getTestStore({
            reducer: { ...userReducer, ...userPermissionsReducer, ...domainsReducer },
            preloadedState: {
                user: getModelState(user),
                userPermissions: getModelState(
                    userPermissions && {
                        ...userPermissions,
                        permissions: getOrgPermissions(userPermissions.Permissions, false),
                        role: user.Role,
                    }
                ),
            },
            extraThunkArguments,
        });
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

    it('should fetch domains for a paid user', async () => {
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

    it('should clear domains for a downgraded user', async () => {
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
        await waitFor(() => expect(selectDomains(store.getState())).toMatchObject(getState([], 0)));
    });
});
