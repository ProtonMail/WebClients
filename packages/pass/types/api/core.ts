import type { Group, GroupMember } from '@proton/shared/lib/interfaces';

export type GroupsGetResponse = {
    Total: number;
    Groups: Group[];
};

export type GroupMembersGetResponse = {
    Total: number;
    Members: GroupMember[];
};
