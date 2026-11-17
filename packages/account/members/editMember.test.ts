import type { Mock } from 'vitest';

import type { ProtonThunkArguments } from '@proton/redux-shared-store-types/interface';
import type { Api } from '@proton/shared/lib/interfaces/Api';
import type { EnhancedMember } from '@proton/shared/lib/interfaces/Member';
import type { RoleAssignment } from '@proton/shared/lib/interfaces/OrganizationRole';

import { assignMemberRoles } from './actions';
import { editMember } from './editMember';
import { getMember } from './getMember';

vi.mock('./getMember', () => ({
    getMember: vi.fn(async () => ({ ID: 'member-id', Name: 'New name' })),
}));

vi.mock('../organization', async () => ({
    ...(await vi.importActual('../organization')),
    organizationThunk: vi.fn(() => 'organizationThunk'),
}));

vi.mock('./actions', async () => ({
    ...(await vi.importActual('./actions')),
    assignMemberRoles: vi.fn(() => 'assignMemberRoles'),
}));

const currentRoles = [{ Role: { OrganizationRoleID: 'owner-role-id' } }] as RoleAssignment[];
const member = { ID: 'member-id', UserOrganizationRoles: currentRoles } as EnhancedMember;
const api = vi.fn() as unknown as Api;

const dispatch: Mock = vi.fn(async (action: unknown) => {
    if (action === 'assignMemberRoles') {
        return { roleAssignments: [], changed: true };
    }
});

const runEditMember = (memberDiff: { name?: string }) =>
    editMember({ member, memberDiff, memberKeyPacketPayload: null, roleIds: new Set(['user-admin-role-id']), api })(
        dispatch as any,
        vi.fn(),
        {} as ProtonThunkArguments
    );

describe('editMember with edited roles', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('assigns the roles after the saved fields are refreshed', async () => {
        const result = await runEditMember({ name: 'New name' });

        expect(assignMemberRoles).toHaveBeenCalledWith({
            member,
            currentRoles,
            desiredRoleIds: new Set(['user-admin-role-id']),
            payload: null,
            api,
        });
        expect(dispatch.mock.calls.map(([action]) => (typeof action === 'string' ? action : action.type))).toEqual([
            'organizationThunk',
            'members/upsertMember',
            'assignMemberRoles',
        ]);
        expect(result).toEqual({ diff: true, member: { ID: 'member-id', Name: 'New name' } });
    });

    it('reports a change when only the roles changed', async () => {
        const result = await runEditMember({});

        expect(getMember).not.toHaveBeenCalled();
        expect(result).toEqual({ diff: true, member: null });
    });
});
