import type { Action, ThunkDispatch } from '@reduxjs/toolkit';

import type { ProtonThunkArguments } from '@proton/redux-shared-store-types';
import { getTestStore } from '@proton/redux-shared-store/test';
import { getMemberOrganizationRoles } from '@proton/shared/lib/api/organizationRoles';
import type { EnhancedMember, RoleAssignment } from '@proton/shared/lib/interfaces';

import { type MembersState, getMemberRolesBatch, invalidateMemberRoles, membersReducer, selectMembers } from './index';

const CHUNK_SIZE = 50;

const getMember = (ID: string): EnhancedMember =>
    ({
        ID,
        Name: `member-${ID}`,
        addressState: 'partial',
        roleState: 'initial',
        UserOrganizationRoles: [],
        requiresOrgKeyPromotion: false,
    }) as unknown as EnhancedMember;

const getMembers = (count: number) => Array.from({ length: count }, (_, index) => getMember(`${index}`));

// Mirrors the private ValueType enum in ./index (complete = fetched list).
const getMembersState = (value: EnhancedMember[]): MembersState['members'] => ({
    value,
    error: undefined,
    meta: { type: 1, fetchedAt: 1_700_000_000, fetchedEphemeral: true },
    unprivatization: { members: {}, loading: { approval: false, automatic: false } },
});

const roleAssignment = {
    Role: { OrganizationRoleID: 'role-1', Name: 'Owner' },
    Source: 1,
} as unknown as RoleAssignment;

const setup = ({
    members,
    api,
    adminRoleEnabled = true,
}: {
    members: EnhancedMember[];
    api: jest.Mock;
    adminRoleEnabled?: boolean;
}) => {
    const extraThunkArguments = {
        api,
        unleashClient: { isEnabled: () => adminRoleEnabled },
    } as unknown as ProtonThunkArguments;

    const { store } = getTestStore({
        reducer: { ...membersReducer },
        preloadedState: { members: getMembersState(members) },
        extraThunkArguments,
    });

    // The whole point of the batch thunk is how few times the store notifies: every commit re-renders
    // the (non-virtualised) members table, so the commit count is the regression guard.
    let commits = 0;
    store.subscribe(() => {
        commits += 1;
    });

    return {
        store,
        dispatch: store.dispatch as ThunkDispatch<MembersState, ProtonThunkArguments, Action>,
        getCommits: () => commits,
        getMembersFromStore: () => selectMembers(store.getState() as MembersState).value ?? [],
    };
};

const resolveRoles = () =>
    jest.fn().mockResolvedValue({ RoleAssignments: [roleAssignment], RequiresOrgKeyPromotion: true });

describe('getMemberRolesBatch', () => {
    afterEach(() => {
        jest.clearAllMocks();
    });

    it('requests every member once and commits one chunk at a time', async () => {
        const members = getMembers(120);
        const api = resolveRoles();
        const { dispatch, getCommits, getMembersFromStore } = setup({ members, api });

        await dispatch(getMemberRolesBatch({ members }));

        expect(api).toHaveBeenCalledTimes(120);
        expect(api).toHaveBeenCalledWith(getMemberOrganizationRoles('0'));
        expect(api).toHaveBeenCalledWith(getMemberOrganizationRoles('119'));

        // 1 commit to mark the batch pending + ceil(120 / 50) = 3 commits landing the results.
        expect(getCommits()).toBe(1 + Math.ceil(120 / CHUNK_SIZE));

        expect(
            getMembersFromStore().every(
                (member) =>
                    member.roleState === 'full' &&
                    member.requiresOrgKeyPromotion &&
                    member.UserOrganizationRoles.length === 1
            )
        ).toBe(true);
    });

    it('keeps the rest of a chunk when one member fails', async () => {
        const members = getMembers(3);
        const api = jest.fn((config: { url: string }) =>
            config.url === getMemberOrganizationRoles('1').url
                ? Promise.reject(new Error('nope'))
                : Promise.resolve({ RoleAssignments: [roleAssignment], RequiresOrgKeyPromotion: false })
        ) as unknown as jest.Mock;
        const { dispatch, getMembersFromStore } = setup({ members, api });

        await dispatch(getMemberRolesBatch({ members }));

        expect(getMembersFromStore().map((member) => member.roleState)).toEqual(['full', 'rejected', 'full']);
    });

    it('does not re-request members that are already pending or resolved', async () => {
        const members = getMembers(3);
        const api = resolveRoles();
        const { dispatch } = setup({ members, api });

        await dispatch(getMemberRolesBatch({ members }));
        expect(api).toHaveBeenCalledTimes(3);

        // The calling effect re-runs on every commit; the pending marker is what stops it from starting
        // an overlapping sweep.
        await dispatch(getMemberRolesBatch({ members }));
        expect(api).toHaveBeenCalledTimes(3);
    });

    it('refetches members whose roles were invalidated', async () => {
        const members = getMembers(2);
        const api = resolveRoles();
        const { dispatch, getMembersFromStore } = setup({ members, api });

        await dispatch(getMemberRolesBatch({ members }));
        expect(api).toHaveBeenCalledTimes(2);

        dispatch(invalidateMemberRoles({ member: members[0] }));
        expect(getMembersFromStore()[0].roleState).toBe('stale');

        await dispatch(getMemberRolesBatch({ members }));
        expect(api).toHaveBeenCalledTimes(3);
        expect(getMembersFromStore()[0].roleState).toBe('full');
    });

    it('does nothing when the admin roles flag is off', async () => {
        const members = getMembers(3);
        const api = resolveRoles();
        const { dispatch, getCommits } = setup({ members, api, adminRoleEnabled: false });

        await dispatch(getMemberRolesBatch({ members }));

        expect(api).not.toHaveBeenCalled();
        expect(getCommits()).toBe(0);
    });
});
