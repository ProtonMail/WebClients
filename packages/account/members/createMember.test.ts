import type { Mock } from 'vitest';

import type { ProtonThunkArguments } from '@proton/redux-shared-store-types/interface';
import { MEMBER_PRIVATE, MEMBER_ROLE } from '@proton/shared/lib/constants';
import type { Api } from '@proton/shared/lib/interfaces/Api';
import type { EnhancedMember, Member } from '@proton/shared/lib/interfaces/Member';
import {
    CreateMemberMode,
    MEMBER_ORG_KEY_STATE,
    MemberUnprivatizationState,
} from '@proton/shared/lib/interfaces/Member';
import type { OrganizationRole } from '@proton/shared/lib/interfaces/OrganizationRole';
import { PREDEFINED_ROLE_NAME } from '@proton/shared/lib/interfaces/OrganizationRole';

import { createMember } from './createMember';
import MemberCreationValidationError from './errors/MemberCreationValidationError';
import { getMember } from './getMember';
import { updateMemberRoles } from './index';
import { getInvitationData } from './unprivatization';
import { updateOwnerRole } from './updateOwnerRole';

vi.mock('./getMember', () => ({
    getMember: vi.fn(async () => ({ ID: 'member-id' })),
}));

vi.mock('../organization', async () => ({
    ...(await vi.importActual('../organization')),
    organizationThunk: vi.fn(() => 'organizationThunk'),
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

vi.mock('../user', () => ({ userThunk: vi.fn(() => 'userThunk') }));
vi.mock('../userKeys', () => ({ userKeysThunk: vi.fn(() => 'userKeysThunk') }));
vi.mock('../addresses', () => ({ addressesThunk: vi.fn(() => 'addressesThunk') }));
vi.mock('./validateAddUser', () => ({ default: vi.fn(() => undefined) }));
vi.mock('@proton/shared/lib/srp', () => ({ srpVerify: vi.fn(async () => ({ Member: { ID: 'member-id' } })) }));

vi.mock('./unprivatization', () => ({
    getInvitationData: vi.fn(async () => 'invitation-data'),
    getSignedInvitationData: vi.fn(async () => 'invitation-signature'),
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

const securityAdminRole = {
    OrganizationRoleID: 'security-admin-role-id',
    Name: PREDEFINED_ROLE_NAME.SECURITY_ADMIN,
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

const getState = vi.fn();
const extra = {} as ProtonThunkArguments;

describe('createMember', () => {
    const createdMember = { ID: 'member-id' } as Member;
    const createApi = vi.fn(async () => ({ Member: createdMember })) as unknown as Api;

    const getCreateDispatch = (passwordless: boolean): Mock => {
        const createDispatch: Mock = vi.fn(async (action: unknown) => {
            if (typeof action === 'function') {
                return action(createDispatch, getState, extra);
            }
            if (action === 'organizationKeyThunk') {
                return { privateKey: {}, Key: passwordless ? { Passwordless: true } : {} };
            }
            if (action === 'organizationRolesThunk') {
                return [ownerRole, securityAdminRole];
            }
            if (action === 'userKeysThunk' || action === 'addressesThunk' || action === 'membersThunk') {
                return [];
            }
            return {};
        });
        return createDispatch;
    };

    const runCreateMember = ({
        passwordless,
        role,
        private: isPrivate = MEMBER_PRIVATE.READABLE,
        roleIds = new Set(),
        mode = CreateMemberMode.Invitation,
    }: {
        passwordless: boolean;
        role: MEMBER_ROLE;
        private?: MEMBER_PRIVATE;
        roleIds?: Set<string>;
        mode?: CreateMemberMode;
    }) =>
        createMember({
            api: createApi,
            single: false,
            verifiedDomains: [],
            validationOptions: {},
            roleIds,
            member: {
                name: 'user',
                addresses: [{ Local: 'user', Domain: 'example.com' }],
                invitationEmail: 'user@external.com',
                mode,
                private: isPrivate,
                storage: 0,
                password: '',
                role,
                numAI: false,
                lumo: false,
            },
        })(getCreateDispatch(passwordless) as any, getState, extra);

    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('assigns the selected roles to a member created with a password', async () => {
        const roleIds = new Set([securityAdminRole.OrganizationRoleID]);
        const result = await runCreateMember({
            passwordless: false,
            role: MEMBER_ROLE.ORGANIZATION_MEMBER,
            mode: CreateMemberMode.Password,
            private: MEMBER_PRIVATE.UNREADABLE,
            roleIds,
        });

        expect(updateMemberRoles).toHaveBeenCalledWith({
            member: createdMember,
            currentRoles: [],
            desiredRoleIds: roleIds,
            api: createApi,
        });
        expect(result).toEqual({ member: createdMember });
    });

    it('returns the role assignment error without failing the creation', async () => {
        const rolesError = new Error('roles');
        vi.mocked(updateMemberRoles).mockImplementationOnce(() => {
            throw rolesError;
        });

        const result = await runCreateMember({
            passwordless: false,
            role: MEMBER_ROLE.ORGANIZATION_MEMBER,
            mode: CreateMemberMode.Password,
            private: MEMBER_PRIVATE.UNREADABLE,
            roleIds: new Set([securityAdminRole.OrganizationRoleID]),
        });

        expect(result).toEqual({ member: createdMember, rolesError });
    });

    it('returns the promotion error of an admin created with a password without failing the creation', async () => {
        const promotionError = new Error('promotion');
        vi.mocked(updateOwnerRole).mockImplementationOnce(() => {
            throw promotionError;
        });

        const result = await runCreateMember({
            passwordless: false,
            role: MEMBER_ROLE.ORGANIZATION_ADMIN,
            mode: CreateMemberMode.Password,
            private: MEMBER_PRIVATE.UNREADABLE,
        });

        expect(updateOwnerRole).toHaveBeenCalledWith({ member: createdMember, makeAdmin: true, api: createApi });
        expect(result).toEqual({ member: createdMember, rolesError: promotionError });
    });

    it('invites a member when an admin is requested in an organization that is not passwordless', async () => {
        await runCreateMember({ passwordless: false, role: MEMBER_ROLE.ORGANIZATION_ADMIN });

        expect(getInvitationData).toHaveBeenCalledWith(expect.objectContaining({ admin: undefined }));
        expect(updateOwnerRole).not.toHaveBeenCalled();
    });

    it('invites a member without the admin flag', async () => {
        await runCreateMember({ passwordless: true, role: MEMBER_ROLE.ORGANIZATION_MEMBER });

        expect(getInvitationData).toHaveBeenCalledWith(expect.objectContaining({ admin: undefined }));
        expect(updateOwnerRole).not.toHaveBeenCalled();
    });

    it('rejects a private admin created with a password in a passwordless organization', async () => {
        await expect(
            runCreateMember({
                passwordless: true,
                role: MEMBER_ROLE.ORGANIZATION_ADMIN,
                mode: CreateMemberMode.Password,
                private: MEMBER_PRIVATE.UNREADABLE,
            })
        ).rejects.toThrow(MemberCreationValidationError);
        expect(createApi).not.toHaveBeenCalled();
    });

    it('rejects a private member with a role requiring the org key in a passwordless organization', async () => {
        await expect(
            runCreateMember({
                passwordless: true,
                role: MEMBER_ROLE.ORGANIZATION_MEMBER,
                mode: CreateMemberMode.Password,
                private: MEMBER_PRIVATE.UNREADABLE,
                roleIds: new Set([ownerRole.OrganizationRoleID]),
            })
        ).rejects.toThrow(MemberCreationValidationError);
        expect(createApi).not.toHaveBeenCalled();
    });

    it('invites an admin and assigns the owner role in a passwordless organization', async () => {
        await runCreateMember({ passwordless: true, role: MEMBER_ROLE.ORGANIZATION_ADMIN });

        expect(getInvitationData).toHaveBeenCalledWith(expect.objectContaining({ admin: true }));
        expect(updateOwnerRole).toHaveBeenCalledWith({ member: createdMember, makeAdmin: true, api: createApi });
    });

    it('invites an admin and assigns the selected roles when they require the org key', async () => {
        // The API returns the invited member with its pending admin invitation
        vi.mocked(getMember).mockResolvedValueOnce(pendingAdminMember);
        const roleIds = new Set([ownerRole.OrganizationRoleID]);
        const result = await runCreateMember({ passwordless: true, role: MEMBER_ROLE.ORGANIZATION_MEMBER, roleIds });

        expect(getInvitationData).toHaveBeenCalledWith(expect.objectContaining({ admin: true }));
        expect(updateOwnerRole).not.toHaveBeenCalled();
        expect(updateMemberRoles).toHaveBeenCalledWith({
            member: pendingAdminMember,
            currentRoles: [],
            desiredRoleIds: roleIds,
            api: createApi,
        });
        expect(result).toEqual({ member: pendingAdminMember });
    });

    it('returns the owner role error of an admin invitation without failing the creation', async () => {
        const ownerRoleError = new Error('owner role');
        vi.mocked(updateOwnerRole).mockImplementationOnce(() => {
            throw ownerRoleError;
        });

        const result = await runCreateMember({ passwordless: true, role: MEMBER_ROLE.ORGANIZATION_ADMIN });

        expect(getInvitationData).toHaveBeenCalledWith(expect.objectContaining({ admin: true }));
        expect(result).toEqual({ member: createdMember, rolesError: ownerRoleError });
    });

    it('rejects a private admin invitation in a passwordless organization', async () => {
        await expect(
            runCreateMember({
                passwordless: true,
                role: MEMBER_ROLE.ORGANIZATION_ADMIN,
                private: MEMBER_PRIVATE.UNREADABLE,
            })
        ).rejects.toThrow(MemberCreationValidationError);
        expect(createApi).not.toHaveBeenCalled();
    });

    it('rejects a private invitation with a role requiring the org key in a passwordless organization', async () => {
        await expect(
            runCreateMember({
                passwordless: true,
                role: MEMBER_ROLE.ORGANIZATION_MEMBER,
                private: MEMBER_PRIVATE.UNREADABLE,
                roleIds: new Set([ownerRole.OrganizationRoleID]),
            })
        ).rejects.toThrow(MemberCreationValidationError);
        expect(createApi).not.toHaveBeenCalled();
    });
});
