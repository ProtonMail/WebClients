import type { MaybeNull } from '@proton/pass/types/utils';
import type { AddressKey, Group as CoreGroup, GroupMember as CoreGroupMember } from '@proton/shared/lib/interfaces';

export type GroupId = string;

export type Group = {
    groupId: GroupId;
    name: string;
    email: string;
    keys: AddressKey[];
    organizationId: MaybeNull<string>;
};

export type GroupMember = {
    email: MaybeNull<string>;
};

export type GroupsResponse = {
    total: number;
    groups: Group[];
};

export type GroupMembersResponse = {
    groupId: GroupId;
    total: number;
    members: GroupMember[];
};

export type GroupWithPublicKeys = {
    group: Group;
    publicKeys: MaybeNull<string[]>;
};

// Core API

export type CoreGroupGetResponse = {
    Group: CoreGroup;
};

export type CoreGroupsGetResponse = {
    Total: number;
    Groups: CoreGroup[];
};

export type CoreGroupMembersGetResponse = {
    Total: number;
    Members: CoreGroupMember[];
};
