import { hasBit } from '@proton/shared/lib/helpers/bitset';
import { type Group, GroupFlags } from '@proton/shared/lib/interfaces';

export const getIsSystemGroup = (group: Group) => {
    return hasBit(group.Flags, GroupFlags.System);
};

export const getIsScimGroupPendingKeys = (group: Group | undefined): boolean => {
    if (typeof group === 'undefined') {
        return false;
    }

    return getIsSystemGroup(group) && !group.Address.HasKeys;
};
