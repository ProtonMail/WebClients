import { combineReducers } from '@reduxjs/toolkit';
import { waitFor } from '@testing-library/react';

import type { ProtonThunkArguments } from '@proton/redux-shared-store-types';
import { getTestStore } from '@proton/redux-shared-store/test';
import { USER_ROLES } from '@proton/shared/lib/constants';
import type { EnhancedMember, UserModel } from '@proton/shared/lib/interfaces';

import { addressesReducer } from '../addresses';
import { getModelState } from '../tests';
import { getServerEvent } from '../tests/getServerEvent';
import { userReducer } from '../user';
import { userPermissionsReducer } from '../userPermissions';
import { type MembersState, canFetchMembers, membersReducer, selectMembers } from './index';
import { membersListener } from './membersListener';

// Mirrors the private ValueType enum in ./index (dummy = free/unprivileged cache, complete = fetched list).
const ValueType = { dummy: 0, complete: 1 } as const;

jest.mock('./index', () => {
    const actual = jest.requireActual('./index');
    return {
        ...actual,
        canFetchMembers: jest.fn(actual.canFetchMembers),
    };
});

const canFetchMembersSpy = jest.mocked(canFetchMembers);

const reducer = combineReducers({
    ...userReducer,
    ...userPermissionsReducer,
    ...addressesReducer,
    ...membersReducer,
});

const getUser = (Role: USER_ROLES) => ({ ID: 'user', Role, isSelf: true }) as UserModel;

const sampleMembers = [{ ID: '1' } as EnhancedMember];

const getMembersState = (
    value: EnhancedMember[] | undefined,
    type: (typeof ValueType)[keyof typeof ValueType],
    fetchedAt = 1_700_000_000
): MembersState['members'] => ({
    value,
    error: undefined,
    meta: { type, fetchedAt, fetchedEphemeral: true },
    unprivatization: { members: {}, loading: { approval: false, automatic: false } },
});

const setup = ({
    user,
    members,
    permissions = [],
}: {
    user: UserModel;
    members: MembersState['members'];
    permissions?: string[];
}) => {
    const api = jest.fn(async () => ({ Roles: [], Permissions: permissions }));
    const extraThunkArguments = {
        api,
        unleashClient: { isEnabled: () => true },
    } as unknown as ProtonThunkArguments;

    const { store, startListening } = getTestStore({
        reducer,
        preloadedState: {
            user: getModelState(user),
            addresses: getModelState([]),
            members,
        },
        extraThunkArguments,
    });

    membersListener(startListening);

    return { store, api };
};

const flush = () => new Promise((resolve) => setTimeout(resolve));

describe('members listener', () => {
    beforeEach(() => {
        canFetchMembersSpy.mockClear();
    });

    it('clears the cached member list when a demoted user loses fetch access', async () => {
        const { store } = setup({
            user: getUser(USER_ROLES.ADMIN_ROLE),
            members: getMembersState(sampleMembers, ValueType.complete),
            permissions: [], // no account.user.read after demotion
        });

        store.dispatch(getServerEvent({ User: getUser(USER_ROLES.MEMBER_ROLE) }));

        await waitFor(() => expect(selectMembers(store.getState()).value).toEqual([]));
        expect(selectMembers(store.getState()).meta.fetchedAt).toBe(0);
        // Proves the spy intercepts the listener's call path, so the negative assertion in
        // 'ignores user changes that do not change the role' is meaningful.
        expect(canFetchMembersSpy).toHaveBeenCalled();
    });

    it('keeps the cached member list when a demoted user still has account.user.read', async () => {
        const { store, api } = setup({
            user: getUser(USER_ROLES.ADMIN_ROLE),
            members: getMembersState(sampleMembers, ValueType.complete),
            permissions: ['account.user.read'], // still allowed via role-based permission
        });

        store.dispatch(getServerEvent({ User: getUser(USER_ROLES.MEMBER_ROLE) }));

        // The effect resolves the permission-aware check (which hits the API) and decides not to reset.
        await waitFor(() => expect(api).toHaveBeenCalled());
        expect(selectMembers(store.getState()).value).toBe(sampleMembers);
        expect(selectMembers(store.getState()).meta.fetchedAt).toBe(1_700_000_000);
    });

    it('invalidates the dummy cache when a user gains access', async () => {
        const { store } = setup({
            user: getUser(USER_ROLES.MEMBER_ROLE),
            members: getMembersState([], ValueType.dummy),
        });

        store.dispatch(getServerEvent({ User: getUser(USER_ROLES.ADMIN_ROLE) }));

        // fetchedAt reset to 0 forces the next read to refetch the real member list.
        await waitFor(() => expect(selectMembers(store.getState()).meta.fetchedAt).toBe(0));
    });

    it('ignores user changes that do not change the role', async () => {
        const { store } = setup({
            user: getUser(USER_ROLES.ADMIN_ROLE),
            members: getMembersState(sampleMembers, ValueType.complete),
        });

        store.dispatch(getServerEvent({ UsedSpace: 999 }));

        await flush();
        expect(canFetchMembersSpy).not.toHaveBeenCalled();
        expect(selectMembers(store.getState()).value).toBe(sampleMembers);
        expect(selectMembers(store.getState()).meta.fetchedAt).toBe(1_700_000_000);
    });

    it('does nothing when there is no cached member list', async () => {
        const { store, api } = setup({
            user: getUser(USER_ROLES.ADMIN_ROLE),
            members: getMembersState(undefined, ValueType.complete),
        });

        store.dispatch(getServerEvent({ User: getUser(USER_ROLES.MEMBER_ROLE) }));

        await flush();
        expect(selectMembers(store.getState()).value).toBeUndefined();
        expect(api).not.toHaveBeenCalled();
    });
});
