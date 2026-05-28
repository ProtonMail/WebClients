import { hasBit } from '@proton/shared/lib/helpers/bitset';
import { type EnhancedGroup, GroupFlags } from '@proton/shared/lib/interfaces';

export const getIsSystemGroup = (group: EnhancedGroup) => {
    return hasBit(group.Flags, GroupFlags.System);
};
