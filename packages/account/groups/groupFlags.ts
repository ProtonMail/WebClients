import { hasBit } from '@proton/shared/lib/helpers/bitset';
import { type Group, GroupFlags } from '@proton/shared/lib/interfaces';

export const getIsSystemGroup = (group: Group) => {
    return hasBit(group.Flags, GroupFlags.System);
};

export const getIsScimGroup = (group: Group | undefined) => {
    return hasBit(group?.Flags, GroupFlags.Scim);
};

export const getIsScimGroupPendingKeys = (group: Group | undefined): boolean => {
    if (typeof group === 'undefined') {
        return false;
    }

    return getIsScimGroup(group) && !group.Address.HasKeys;
};
