import { api } from '@proton/pass/lib/api/api';
import { parseGroup, parseGroupMember } from '@proton/pass/lib/groups/groups.parsers';
import type {
    CoreGroupGetResponse,
    CoreGroupMembersGetResponse,
    CoreGroupsGetResponse,
    Group,
    GroupMembersResponse,
    GroupsResponse,
} from '@proton/pass/lib/groups/groups.types';
import {
    getGroup as coreGetGroup,
    getGroupMembers as coreGetGroupMembers,
    getGroups as coreGetGroups,
} from '@proton/shared/lib/api/groups';
import { GROUP_MEMBER_STATE } from '@proton/shared/lib/interfaces';

export const getGroup = async (groupID: string): Promise<Group> => {
    const response = await api<CoreGroupGetResponse>(coreGetGroup(groupID));
    return parseGroup(response.Group);
};

export const getGroups = async (): Promise<GroupsResponse> => {
    const response = await api<CoreGroupsGetResponse>(coreGetGroups());
    return {
        total: response.Total,
        groups: response.Groups.map(parseGroup),
    };
};

export const getGroupMembers = async (groupId: string): Promise<GroupMembersResponse> => {
    const response = await api<CoreGroupMembersGetResponse>(coreGetGroupMembers(groupId));
    return {
        groupId,
        total: response.Total,
        members: response.Members.filter((member) => member.State === GROUP_MEMBER_STATE.ACTIVE).map(parseGroupMember),
    };
};
