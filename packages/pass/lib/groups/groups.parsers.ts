import type { Group, GroupMember } from '@proton/pass/lib/groups/groups.types';
import type { Group as CoreGroup, GroupMember as CoreGroupMember } from '@proton/shared/lib/interfaces';

export const parseGroup = (input: CoreGroup): Group => ({
    groupId: input.ID,
    name: input.Name,
    email: input.Address.Email,
    keys: input.Address.Keys,
    organizationId: null,
});

export const parseGroupMember = (input: CoreGroupMember): GroupMember => ({
    email: input.Email,
});
