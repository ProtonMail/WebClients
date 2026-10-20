import type { Group as CoreGroup } from '@proton/shared/lib/interfaces/Group';
import type { GroupMember as CoreGroupMember } from '@proton/shared/lib/interfaces/GroupMember';
import type { AddressKey } from '@proton/shared/lib/interfaces/Key';

import type { MaybeNull } from '../../types/utils';

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
