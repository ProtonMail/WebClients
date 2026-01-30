import { useGroupMemberships } from '@proton/account/groupMemberships/hooks';
import { isGroupOwner } from '@proton/account/groupOwnerInvites/isGroupOwner';
import { useGroups } from '@proton/account/groups/hooks';

/**
 * Hook to check if the current user is a group owner
 * Returns true if user has OWNER permissions in any group
 */
export const useIsGroupOwner = (): [result: null, loading: true] | [result: boolean, loading: false] => {
    const [groups, loadingGroups] = useGroups();
    const [memberships, loadingMemberships] = useGroupMemberships();

    if (loadingGroups || loadingMemberships) {
        return [null, true] as const;
    }

    if (!groups || !memberships) {
        return [false, false] as const;
    }

    return [isGroupOwner(groups, memberships), false];
};
