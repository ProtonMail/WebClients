import type { ProtonThunkArguments } from '@proton/redux-shared-store-types/interface';
import { MEMBER_ROLE } from '@proton/shared/lib/constants';
import type { Api } from '@proton/shared/lib/interfaces/Api';
import type { EnhancedMember } from '@proton/shared/lib/interfaces/Member';
import { MEMBER_ORG_KEY_STATE, MemberUnprivatizationState } from '@proton/shared/lib/interfaces/Member';
import type { OrganizationRole } from '@proton/shared/lib/interfaces/OrganizationRole';
import { PREDEFINED_ROLE_NAME } from '@proton/shared/lib/interfaces/OrganizationRole';

import { assignMemberRoles, provideOrgKeyAccessToMember, resumeMemberRoleAssignment } from './actions';

jest.mock('../organizationRoles', () => ({
    ...jest.requireActual('../organizationRoles'),
    organizationRolesThunk: jest.fn(() => 'organizationRolesThunk'),
}));

jest.mock('../organizationKey', () => ({
    ...jest.requireActual('../organizationKey'),
    organizationKeyThunk: jest.fn(() => 'organizationKeyThunk'),
}));

jest.mock('./index', () => ({
    ...jest.requireActual('./index'),
    updateMemberRoles: jest.fn(() => 'updateMemberRoles'),
    membersThunk: jest.fn(() => 'membersThunk'),
    getMemberRoles: jest.fn(() => 'getMemberRoles'),
}));

const ownerRole = {
    OrganizationRoleID: 'owner-role-id',
    Name: PREDEFINED_ROLE_NAME.OWNER,
} as OrganizationRole;

const pendingAdminMember = {
    ID: 'member-id',
    Role: MEMBER_ROLE.ORGANIZATION_MEMBER,
    AccessToOrgKey: MEMBER_ORG_KEY_STATE.NoKey,
    requiresOrgKeyPromotion: true,
    Unprivatization: {
        State: MemberUnprivatizationState.Pending,
        InvitationData: JSON.stringify({ Address: 'user@example.com', Revision: 1, Admin: true }),
    },
} as EnhancedMember;

const api = jest.fn() as unknown as Api;

const getState = jest.fn();
const extra = {} as ProtonThunkArguments;

const dispatch: jest.Mock = jest.fn(async (action: unknown) => {
    if (typeof action === 'function') {
        return action(dispatch, getState, extra);
    }
    if (action === 'membersThunk') {
        return [pendingAdminMember];
    }
    if (action === 'getMemberRoles') {
        return [];
    }
    if (action === 'organizationRolesThunk') {
        return [ownerRole];
    }
    if (action === 'updateMemberRoles') {
        return { changed: true };
    }
    throw new Error(`Unexpected dispatch ${String(action)}`);
});

describe('member role actions with a pending admin invitation', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('assigns a role requiring the org key without promoting the member again', async () => {
        const result = await assignMemberRoles({
            member: pendingAdminMember,
            currentRoles: [],
            desiredRoleIds: new Set([ownerRole.OrganizationRoleID]),
            payload: null,
            api,
        })(dispatch as any, getState, extra);

        expect(result).toEqual({ changed: true });
        expect(dispatch).toHaveBeenCalledTimes(2);
        expect(dispatch).not.toHaveBeenCalledWith('organizationKeyThunk');
    });

    it('does not provide org key access again', async () => {
        await provideOrgKeyAccessToMember({ member: pendingAdminMember, api })(dispatch as any, getState, extra);

        expect(dispatch).not.toHaveBeenCalled();
    });

    it('resumes the role assignment without an error while the member has not accepted the invitation', async () => {
        await expect(
            resumeMemberRoleAssignment({ memberID: pendingAdminMember.ID, api })(dispatch as any, getState, extra)
        ).resolves.toBeUndefined();
    });
});
