import type {
    Address,
    GROUP_MEMBER_PERMISSIONS,
    GroupFlags,
    GroupMemberType,
    GroupPermissions,
    ProxyInstances,
} from '../interfaces';

interface GroupParameters {
    Name: string;
    Email: string;
    ParentGroup?: string;
    Permissions: number;
    Description: string;
    Flags: GroupFlags;
}

export const createGroup = (groupParams: GroupParameters) => ({
    method: 'post',
    url: 'core/v4/groups',
    data: {
        ...groupParams,
    },
});

export const editGroup = (groupID: string, groupParams: Partial<GroupParameters>) => ({
    method: 'put',
    url: `core/v4/groups/${groupID}`,
    data: {
        ...groupParams,
    },
});

export const deleteGroup = (groupID: string) => ({
    method: 'delete',
    url: `core/v4/groups/${groupID}`,
});

export interface GroupResult {
    ID: string;
    Name: string;
    Description: string;
    Address: Address;
    CreateTime: number;
    Permissions: GroupPermissions;
    Flags: GroupFlags;
}

export const getGroups = () => ({
    method: 'get',
    url: 'core/v4/groups',
});

export const getGroupMembers = (groupID: string) => ({
    method: 'get',
    url: `core/v4/groups/${groupID}/members`,
});

export interface GroupMemberParameters {
    Type: GroupMemberType;
    GroupID: string; // encrypted
    Email: string;
    AddressSignaturePacket: string;
    GroupMemberAddressPrivateKey?: string; // Only for internal E2EE member
    ActivationToken?: string; // Only for internal E2EE member
    ProxyInstances?: ProxyInstances[]; // Only for E2EE member
    Token?: string;
    Signature?: string;
    Permissions?: GROUP_MEMBER_PERMISSIONS;
}

export const addGroupMember = (addMemberParams: GroupMemberParameters) => ({
    method: 'post',
    url: 'core/v4/groups/members',
    data: {
        ...addMemberParams,
    },
});

export const updateGroupMember = (groupMemberID: string, groupMemberParams: Partial<GroupMemberParameters>) => ({
    method: 'put',
    url: `core/v4/groups/members/${groupMemberID}`,
    data: {
        ...groupMemberParams,
    },
});

export const deleteGroupMember = (groupMemberID: string) => ({
    method: 'delete',
    url: `core/v4/groups/members/${groupMemberID}`,
});

export const resumeGroupMember = (groupMemberID: string) => ({
    method: 'put',
    url: `core/v4/groups/members/${groupMemberID}/resume`,
});

export const deleteAllGroupMembers = (groupID: string) => ({
    method: 'delete',
    url: `core/v4/groups/members/${groupID}`,
});

export const resendGroupInvitation = (groupMemberID: string) => ({
    method: 'put',
    url: `core/v4/groups/members/${groupMemberID}/reinvite`,
});

export const getGroupMembership = () => ({
    method: 'get',
    url: `core/v4/groups/members/internal`,
});

export const getExternalGroupMembership = (jwt: string) => ({
    method: 'get',
    url: `core/v4/groups/members/external/${jwt}`,
});

export const acceptExternalGroupMembership = (jwt: string) => ({
    method: 'put',
    url: `core/v4/groups/external/${jwt}`,
});

export const declineExternalGroupMembership = (jwt: string) => ({
    method: 'delete',
    url: `core/v4/groups/external/${jwt}`,
});
