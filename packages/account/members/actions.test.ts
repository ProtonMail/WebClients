import type { ProtonThunkArguments } from '@proton/redux-shared-store-types';
import { MEMBER_ROLE } from '@proton/shared/lib/constants';
import type { Api, EnhancedMember } from '@proton/shared/lib/interfaces';
import { MemberUnprivatizationState } from '@proton/shared/lib/interfaces';
import type { OrganizationRole } from '@proton/shared/lib/interfaces/OrganizationRole';
import { PREDEFINED_ROLE_NAME } from '@proton/shared/lib/interfaces/OrganizationRole';

import { assignMemberRoles, provideOrgKeyAccessToMember } from './actions';

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
}));

const ownerRole = {
    OrganizationRoleID: 'owner-role-id',
    Name: PREDEFINED_ROLE_NAME.OWNER,
} as OrganizationRole;

const pendingAdminMember = {
    ID: 'member-id',
    Role: MEMBER_ROLE.ORGANIZATION_MEMBER,
    Unprivatization: {
        State: MemberUnprivatizationState.Pending,
        InvitationData: JSON.stringify({ Address: 'user@example.com', Revision: 1, Admin: true }),
    },
} as EnhancedMember;

const api = jest.fn() as unknown as Api;

const dispatch = jest.fn(async (action: unknown) => {
    if (action === 'organizationRolesThunk') {
        return [ownerRole];
    }
    if (action === 'updateMemberRoles') {
        return { changed: true };
    }
    throw new Error(`Unexpected dispatch ${String(action)}`);
});

const getState = jest.fn();
const extra = {} as ProtonThunkArguments;

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
});
