import type { Group as CoreGroup } from '@proton/shared/lib/interfaces/Group';
import type { GroupMember as CoreGroupMember } from '@proton/shared/lib/interfaces/GroupMember';

import type { Group, GroupMember } from './groups.types';

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
