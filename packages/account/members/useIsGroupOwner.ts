import { useGroupMemberships } from '@proton/account/groupMemberships/hooks';
import { useGroups } from '@proton/account/groups/hooks';

import { isGroupOwner } from './isGroupOwner';

/**
 * Hook to check if the current user is a group owner
 * Returns true if user has OWNER permissions in any group
 */
export const useIsGroupOwner = (): [result: boolean | null, loading: boolean] => {
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
