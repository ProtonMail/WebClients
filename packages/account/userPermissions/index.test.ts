import type { ProtonThunkArguments } from '@proton/redux-shared-store-types';
import { getTestStore } from '@proton/redux-shared-store/test';
import { CacheType } from '@proton/redux-utilities/interface';
import { USER_ROLES } from '@proton/shared/lib/constants';
import type { UserModel } from '@proton/shared/lib/interfaces';
import { PERMISSIONS } from '@proton/shared/lib/interfaces/UserPermission';

import { getModelState } from '../test';
import { getServerEvent } from '../test/getServerEvent';
import { userReducer, userThunk } from '../user';
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

    const setupWithApi = ({ user, api }: { user: UserModel; api: (config: any) => Promise<any> }) => {
        const extraThunkArguments = {
            api,
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

    it('invalidates the cached permissions without blanking them when the user role changes', async () => {
        const user = { isAdmin: false, isSelf: true, Role: USER_ROLES.MEMBER_ROLE } as UserModel;
        let granted = ['account.user.read'];
        let permissionsCalls = 0;
        const { store } = setupWithApi({
            user,
            api: async (config) => {
                if (config.url === 'core/v4/users') {
                    return { User: user };
                }
                permissionsCalls++;
                return { Roles: [], Permissions: granted };
            },
        });

        await store.dispatch(userPermissionsThunk());
        expect(selectUserPermissions(store.getState()).value?.role).toBe(USER_ROLES.MEMBER_ROLE);

        // A role change arriving via the event loop must invalidate the cached permissions
        // so the next request refetches them.
        store.dispatch(getServerEvent({ User: { ...user, Role: USER_ROLES.ADMIN_ROLE } }));

        // The previously fetched value keeps being served in the meantime: consumers use
        // `permissions === null` as a loading signal, so blanking it here would hide the org
        // settings behind a spinner for the duration of the refetch.
        const invalidated = selectUserPermissions(store.getState());
        expect(invalidated.value?.permissions?.['account.user.read']).toBe(true);
        expect(invalidated.value?.role).toBe(USER_ROLES.MEMBER_ROLE);
        // But the cache is marked expired, so the value is not served again without a refetch.
        expect(invalidated.meta.fetchedEphemeral).toBeUndefined();
        expect(invalidated.meta.fetchedAt).toBe(0);
        expect(permissionsCalls).toBe(1);

        // Refetching picks up the new role and permissions.
        granted = ['account.user.read', 'account.user.create'];
        await store.dispatch(userPermissionsThunk());
        expect(permissionsCalls).toBe(2);
        const refetched = selectUserPermissions(store.getState()).value;
        expect(refetched?.role).toBe(USER_ROLES.ADMIN_ROLE);
        expect(refetched?.permissions?.['account.user.create']).toBe(true);
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

describe('refreshing the user after accepting a group invitation', () => {
    // What acceptGroupInvitation does: the group's role assignment isn't carried in an event loop
    // event, so it refetches the user, and userFulfilled invalidates the permissions from there.
    const run = async ({ newRole }: { newRole: number }) => {
        const user = { isAdmin: false, isSelf: true, Role: USER_ROLES.MEMBER_ROLE } as UserModel;
        const extraThunkArguments = {
            api: async (config: any) => {
                if (config.url === 'core/v4/users') {
                    return { User: { ...user, Role: newRole } };
                }
                return { Roles: [], Permissions: ['account.user.read'] };
            },
            unleashClient: { isEnabled: () => true },
        } as unknown as ProtonThunkArguments;

        const { store } = getTestStore({
            reducer: { ...userReducer, ...userPermissionsReducer },
            preloadedState: { user: getModelState(user) },
            extraThunkArguments,
        });

        // Prime the cache the way the app bootstrap does.
        await store.dispatch(userPermissionsThunk());

        // Record every distinct value the slice takes while the refresh runs.
        const seen: (boolean | null)[] = [];
        const record = () => {
            const value = selectUserPermissions(store.getState()).value;
            const state = value?.permissions === null ? null : !!value?.permissions?.['account.user.read'];
            if (seen[seen.length - 1] !== state) {
                seen.push(state);
            }
        };
        record();
        const unsubscribe = store.subscribe(record);

        await store.dispatch(userThunk({ cache: CacheType.None }));

        unsubscribe();
        return { seen, state: selectUserPermissions(store.getState()) };
    };

    it('leaves the permissions untouched when the role is unchanged', async () => {
        const { seen, state } = await run({ newRole: USER_ROLES.MEMBER_ROLE });
        expect(seen).toEqual([true]);
        expect(state.meta.fetchedEphemeral).toBe(true);
    });

    it('invalidates but never blanks the permissions when the role changes', async () => {
        const { seen, state } = await run({ newRole: USER_ROLES.ADMIN_ROLE });
        // The previously fetched value keeps being served, so no consumer observes `permissions === null`
        // and the sidebar/settings area don't flash their loading state mid-refresh.
        expect(seen).toEqual([true]);
        // The cache is still marked stale, which is what makes the hook re-enqueue the thunk.
        expect(state.meta.fetchedEphemeral).toBeUndefined();
        expect(state.meta.fetchedAt).toBe(0);
    });
});
