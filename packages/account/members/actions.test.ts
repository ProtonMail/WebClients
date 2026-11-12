import type { Mock } from 'vitest';

import type { ProtonThunkArguments } from '@proton/redux-shared-store-types/interface';
import { MEMBER_ROLE } from '@proton/shared/lib/constants';
import type { Api } from '@proton/shared/lib/interfaces/Api';
import type { EnhancedMember, Member } from '@proton/shared/lib/interfaces/Member';
import { MEMBER_ORG_KEY_STATE, MemberUnprivatizationState } from '@proton/shared/lib/interfaces/Member';
import type { OrganizationRole, RoleAssignment } from '@proton/shared/lib/interfaces/OrganizationRole';
import { PREDEFINED_ROLE_NAME, ROLE_SOURCE } from '@proton/shared/lib/interfaces/OrganizationRole';

import type { PromoteGlobalSSOPayload } from '../organizationKey/actions';
import {
    assignMemberRoles,
    provideOrgKeyAccessToMember,
    resumeMemberRoleAssignment,
    setMemberOwnerRole,
    setRole,
} from './actions';
import { deleteRequestUnprivatization, requestUnprivatization } from './unprivatizeActions';
import { updateOwnerRole } from './updateOwnerRole';

vi.mock('./getMember', () => ({
    getMember: vi.fn(async () => ({ ID: 'member-id' })),
}));

vi.mock('../organization', async () => ({
    ...(await vi.importActual('../organization')),
    organizationThunk: vi.fn(() => 'organizationThunk'),
}));

vi.mock('../organizationKey/actions', async () => ({
    ...(await vi.importActual('../organizationKey/actions')),
    getMemberEditPayload: vi.fn(() => 'getMemberEditPayload'),
}));

vi.mock('./unprivatizeActions', async () => ({
    ...(await vi.importActual('./unprivatizeActions')),
    requestUnprivatization: vi.fn(() => 'requestUnprivatization'),
    deleteRequestUnprivatization: vi.fn(() => 'deleteRequestUnprivatization'),
}));

vi.mock('./updateOwnerRole', async () => ({
    ...(await vi.importActual('./updateOwnerRole')),
    updateOwnerRole: vi.fn(() => 'updateOwnerRole'),
}));

vi.mock('../organizationRoles', async () => ({
    ...(await vi.importActual('../organizationRoles')),
    organizationRolesThunk: vi.fn(() => 'organizationRolesThunk'),
}));

vi.mock('../organizationKey', async () => ({
    ...(await vi.importActual('../organizationKey')),
    organizationKeyThunk: vi.fn(() => 'organizationKeyThunk'),
}));

vi.mock('./index', async () => ({
    ...(await vi.importActual('./index')),
    updateMemberRoles: vi.fn(() => 'updateMemberRoles'),
    membersThunk: vi.fn(() => 'membersThunk'),
    getMemberRoles: vi.fn(() => 'getMemberRoles'),
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

const api = vi.fn() as unknown as Api;

const getState = vi.fn();
const extra = {} as ProtonThunkArguments;

const dispatch: Mock = vi.fn(async (action: unknown) => {
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
        vi.clearAllMocks();
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

describe('setRole for an SSO member who has not signed in', () => {
    const ssoMember = { ID: 'sso-member-id', SSO: 1, Role: MEMBER_ROLE.ORGANIZATION_MEMBER } as Member;

    const promoteGlobalSSOPayload: PromoteGlobalSSOPayload = {
        type: 'promote-global-sso',
        address: undefined,
        email: 'user@example.com',
        member: ssoMember,
    };

    const setRoleDispatch: Mock = vi.fn(async (action: unknown) => {
        if (typeof action === 'function') {
            return action(setRoleDispatch, getState, extra);
        }
        if (action === 'organizationKeyThunk') {
            return { Key: { Passwordless: true } };
        }
    });

    const runSetRole = (role: MEMBER_ROLE, syncOwner: boolean) =>
        setRole({ member: ssoMember, payload: promoteGlobalSSOPayload, api, role, syncOwner })(
            setRoleDispatch as any,
            getState,
            extra
        );

    const getDispatchedActions = () => setRoleDispatch.mock.calls.map(([action]) => action);

    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('assigns the owner role before requesting admin access when the owner role is synced', async () => {
        await runSetRole(MEMBER_ROLE.ORGANIZATION_ADMIN, true);

        expect(updateOwnerRole).toHaveBeenCalledWith({ member: ssoMember, makeAdmin: true, api });
        expect(requestUnprivatization).toHaveBeenCalledWith({ member: ssoMember, api, makeAdmin: true });
        expect(getDispatchedActions()).toEqual(['organizationKeyThunk', 'updateOwnerRole', 'requestUnprivatization']);
    });

    it('requests admin access without the owner role when the owner role is not synced', async () => {
        await runSetRole(MEMBER_ROLE.ORGANIZATION_ADMIN, false);

        expect(updateOwnerRole).not.toHaveBeenCalled();
        expect(getDispatchedActions()).toEqual(['organizationKeyThunk', 'requestUnprivatization']);
    });

    it('removes the owner role before deleting the admin access request when the owner role is synced', async () => {
        await runSetRole(MEMBER_ROLE.ORGANIZATION_MEMBER, true);

        expect(updateOwnerRole).toHaveBeenCalledWith({ member: ssoMember, makeAdmin: false, api });
        expect(deleteRequestUnprivatization).toHaveBeenCalledWith({ member: ssoMember, api });
        expect(getDispatchedActions()).toEqual(['updateOwnerRole', 'deleteRequestUnprivatization']);
    });

    it('deletes the admin access request without touching the owner role when the owner role is not synced', async () => {
        await runSetRole(MEMBER_ROLE.ORGANIZATION_MEMBER, false);

        expect(updateOwnerRole).not.toHaveBeenCalled();
        expect(getDispatchedActions()).toEqual(['deleteRequestUnprivatization']);
    });
});

describe('removing roles from a member with a pending admin request', () => {
    const userAdminRole = {
        OrganizationRoleID: 'user-admin-role-id',
        Name: PREDEFINED_ROLE_NAME.USER_ADMIN,
    } as OrganizationRole;

    const securityAdminRole = {
        OrganizationRoleID: 'security-admin-role-id',
        Name: PREDEFINED_ROLE_NAME.SECURITY_ADMIN,
    } as OrganizationRole;

    const getRoleAssignment = (Role: OrganizationRole, Source = ROLE_SOURCE.USER) =>
        ({ Role, Source }) as RoleAssignment;

    const promoteGlobalSSOPayload: PromoteGlobalSSOPayload = {
        type: 'promote-global-sso',
        address: undefined,
        email: 'user@example.com',
        member: pendingAdminMember,
    };

    const roleDispatch: Mock = vi.fn(async (action: unknown) => {
        if (typeof action === 'function') {
            return action(roleDispatch, getState, extra);
        }
        if (action === 'organizationRolesThunk') {
            return [ownerRole, userAdminRole, securityAdminRole];
        }
        if (action === 'organizationKeyThunk') {
            return { Key: { Passwordless: true } };
        }
        if (action === 'getMemberEditPayload') {
            return promoteGlobalSSOPayload;
        }
        if (action === 'updateMemberRoles') {
            return { changed: true };
        }
    });

    const runAssignMemberRoles = (
        member: EnhancedMember,
        currentRoles: RoleAssignment[],
        desiredRoles: OrganizationRole[]
    ) =>
        assignMemberRoles({
            member,
            currentRoles,
            desiredRoleIds: new Set(desiredRoles.map(({ OrganizationRoleID }) => OrganizationRoleID)),
            payload: null,
            api,
        })(roleDispatch as any, getState, extra);

    const getDispatchedActions = () =>
        roleDispatch.mock.calls.map(([action]) => action).filter((action) => typeof action === 'string');

    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('deletes the pending admin request before removing the last role requiring the org key', async () => {
        await runAssignMemberRoles(pendingAdminMember, [getRoleAssignment(userAdminRole)], []);

        expect(deleteRequestUnprivatization).toHaveBeenCalledWith({ member: pendingAdminMember, api });
        expect(getDispatchedActions()).toEqual([
            'organizationRolesThunk',
            'deleteRequestUnprivatization',
            'updateMemberRoles',
        ]);
    });

    it('keeps the pending admin request when a group still gives a role requiring the org key', async () => {
        await runAssignMemberRoles(
            pendingAdminMember,
            [getRoleAssignment(userAdminRole), getRoleAssignment(ownerRole, ROLE_SOURCE.GROUP)],
            []
        );

        expect(deleteRequestUnprivatization).not.toHaveBeenCalled();
    });

    it('keeps the pending admin request when the member keeps a role requiring the org key', async () => {
        await runAssignMemberRoles(
            pendingAdminMember,
            [getRoleAssignment(ownerRole), getRoleAssignment(userAdminRole)],
            [userAdminRole]
        );

        expect(deleteRequestUnprivatization).not.toHaveBeenCalled();
    });

    it('keeps the pending admin request when the member held no role requiring the org key (legacy admin)', async () => {
        await runAssignMemberRoles(pendingAdminMember, [], [securityAdminRole]);

        expect(deleteRequestUnprivatization).not.toHaveBeenCalled();
    });

    it('deletes the pending admin request once when the owner toggle removes the only role requiring the org key', async () => {
        const member = { ...pendingAdminMember, UserOrganizationRoles: [getRoleAssignment(ownerRole)] };

        const result = await setMemberOwnerRole({
            member,
            makeAdmin: false,
            api,
            confirm: vi.fn(async () => true),
        })(roleDispatch as any, getState, extra);

        expect(result).toEqual({ confirmed: true, changed: true, desiredRoleIds: new Set() });
        expect(deleteRequestUnprivatization).toHaveBeenCalledTimes(1);
        expect(updateOwnerRole).not.toHaveBeenCalled();
    });
});
