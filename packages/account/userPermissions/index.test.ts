import type { ProtonThunkArguments } from '@proton/redux-shared-store-types';
import { getTestStore } from '@proton/redux-shared-store/test';
import { USER_ROLES } from '@proton/shared/lib/constants';
import type { UserModel } from '@proton/shared/lib/interfaces';
import { PERMISSIONS } from '@proton/shared/lib/interfaces/UserPermission';

import { getModelState } from '../test';
import { getServerEvent } from '../test/getServerEvent';
import { userReducer } from '../user';
import { getOrgPermissions, selectUserPermissions, userPermissionsReducer, userPermissionsThunk } from './index';

describe('getOrgPermissions', () => {
    it('grants all permissions to a legacy admin (isLegacyAdmin)', () => {
        const record = getOrgPermissions([], true);
        PERMISSIONS.forEach((p) => expect(record[p]).toBe(true));
    });

    it('grants only assigned permissions to a regular user', () => {
        const granted = 'account.user.read';
        const record = getOrgPermissions([granted], false);
        expect(record[granted]).toBe(true);
        PERMISSIONS.filter((p) => p !== granted).forEach((p) => expect(record[p]).toBe(false));
    });

    it('denies all permissions when user has no roles and is not a legacy admin', () => {
        const record = getOrgPermissions([], false);
        PERMISSIONS.forEach((p) => expect(record[p]).toBe(false));
    });

    it('grants all permissions to a legacy admin regardless of assigned permissions', () => {
        const record = getOrgPermissions(['account.user.read'], true);
        PERMISSIONS.forEach((p) => expect(record[p]).toBe(true));
    });
});

describe('userPermissionsThunk', () => {
    const setup = ({ user, permissions }: { user: UserModel; permissions: string[] }) => {
        const extraThunkArguments = {
            api: async () => ({ Roles: [], Permissions: permissions }),
            unleashClient: { isEnabled: () => true },
        } as unknown as ProtonThunkArguments;
        return getTestStore({
            reducer: { ...userReducer, ...userPermissionsReducer },
            preloadedState: {
                user: getModelState(user),
            },
            extraThunkArguments,
        });
    };

    it('does not grant all permissions to an impersonating admin (isAdmin && !isSelf)', async () => {
        const { store } = setup({
            // An admin accessing a member account: isAdmin is true but isSelf is false.
            user: { isAdmin: true, isSelf: false, Role: USER_ROLES.ADMIN_ROLE } as UserModel,
            permissions: ['account.user.read'],
        });
        const { permissions } = await store.dispatch(userPermissionsThunk());
        // Only the API-granted permission is present, not blanket admin access.
        expect(permissions?.['account.user.read']).toBe(true);
        expect(permissions?.['account.user.create']).toBe(false);
    });

    it('resets the cached permissions when the user role changes', async () => {
        const user = { isAdmin: false, isSelf: true, Role: USER_ROLES.MEMBER_ROLE } as UserModel;
        const { store } = setup({ user, permissions: ['account.user.read'] });

        await store.dispatch(userPermissionsThunk());
        expect(selectUserPermissions(store.getState()).value?.role).toBe(USER_ROLES.MEMBER_ROLE);

        // A role change arriving via the event loop must invalidate the cached permissions
        // so the next request refetches them.
        store.dispatch(getServerEvent({ User: { ...user, Role: USER_ROLES.ADMIN_ROLE } }));
        expect(selectUserPermissions(store.getState()).value).toEqual({
            permissions: null,
            role: 0,
            Roles: [],
            Permissions: [],
            ShowAdminRolesUI: false,
        });

        // Refetching picks up the new role.
        await store.dispatch(userPermissionsThunk());
        expect(selectUserPermissions(store.getState()).value?.role).toBe(USER_ROLES.ADMIN_ROLE);
    });

    it('falls back to the safe legacy-admin default when the endpoint call fails', async () => {
        const extraThunkArguments = {
            api: async () => {
                throw new Error('network error');
            },
            unleashClient: { isEnabled: () => true },
        } as unknown as ProtonThunkArguments;
        const { store } = getTestStore({
            reducer: { ...userReducer, ...userPermissionsReducer },
            preloadedState: {
                user: getModelState({ isAdmin: true, isSelf: true, Role: USER_ROLES.ADMIN_ROLE } as UserModel),
            },
            extraThunkArguments,
        });

        const result = await store.dispatch(userPermissionsThunk());

        // `permissions` must never stay null forever: UI guards use `permissions === null` as the
        // loading signal, so a failed fetch that leaves it null would spin an infinite loader.
        expect(result.permissions).not.toBeNull();
        PERMISSIONS.forEach((p) => expect(result.permissions?.[p]).toBe(true));
    });

    it('keeps the cached permissions when the user role is unchanged', async () => {
        const user = { isAdmin: false, isSelf: true, Role: USER_ROLES.MEMBER_ROLE } as UserModel;
        const { store } = setup({ user, permissions: ['account.user.read'] });

        await store.dispatch(userPermissionsThunk());
        const cached = selectUserPermissions(store.getState()).value;

        store.dispatch(getServerEvent({ User: { ...user, Role: USER_ROLES.MEMBER_ROLE } }));
        expect(selectUserPermissions(store.getState()).value).toBe(cached);
    });
});
