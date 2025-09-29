import type { Address, GroupFlags, GroupMemberType, GroupPermissions, ProxyInstances } from '../interfaces';

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

export const getGroup = (groupID: string) => ({
    method: 'get',
    url: `core/v4/groups/${groupID}`,
});

export const getGroupMembers = (groupID: string) => ({
    method: 'get',
    url: `core/v4/groups/${groupID}/members`,
});

export const getGroupMember = (memberID: string) => ({
    method: 'get',
    url: `core/v4/groups/members/${memberID}`,
});

export interface AddGroupMemberParameters {
    GroupID: string;
    Email: string;
    AddressSignaturePacket: string;
}

interface AddExternalGroupMemberParameters extends AddGroupMemberParameters {
    Type: GroupMemberType.External;
}

interface BaseAddInternalGroupMemberParameters extends AddGroupMemberParameters {
    Type: GroupMemberType.Internal;
    GroupMemberAddressPrivateKey: string;
    AddressSignaturePacket: string;
    ProxyInstances: ProxyInstances[];
}

interface AddInternalNonPrivateGroupMemberParameters extends BaseAddInternalGroupMemberParameters {
    Token: string;
    Signature: string;
}

interface AddInternalGroupMemberParameters extends BaseAddInternalGroupMemberParameters {
    GroupMemberAddressPrivateKey: string;
    ActivationToken: string;
}

export const addGroupMember = (
    data:
        | AddExternalGroupMemberParameters
        | AddInternalNonPrivateGroupMemberParameters
        | AddInternalGroupMemberParameters
) => ({
    method: 'post',
    url: 'core/v4/groups/members',
    data,
});

export const updateGroupMember = (
    groupMemberID: string,
    groupMemberParams: { GroupID: string; Permissions: GroupPermissions }
) => ({
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

export const reinviteGroupMember = (groupMemberID: string) => ({
    method: 'put',
    url: `core/v4/groups/${groupMemberID}/reinvite`,
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

export const getExternalGroupMemberships = (jwt: string) => ({
    method: 'get',
    url: `core/v4/groups/members/external/${jwt}`,
});

export const acceptExternalGroupMembership = (jwt: string, groupID: string | null = null) => ({
    method: 'put',
    url: `core/v4/groups/external/${jwt}`,
    params: groupID ? { GroupID: groupID } : {},
});

export const declineExternalGroupMembership = (jwt: string, groupID: string | null = null) => ({
    method: 'delete',
    url: `core/v4/groups/external/${jwt}`,
    params: groupID ? { GroupID: groupID } : {},
});
