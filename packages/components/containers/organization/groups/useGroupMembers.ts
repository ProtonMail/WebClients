import { useState } from 'react';

import { useApi } from '@proton/components';
import { deleteGroupMember, getGroupMembers } from '@proton/shared/lib/api/groups';
import type { GroupMember } from '@proton/shared/lib/interfaces';

const useGroupMembers = () => {
    const [groupMembers, setGroupMembers] = useState<GroupMember[]>([]);
    const api = useApi();

    const fetchGroupMembers = async (groupID?: string) => {
        setGroupMembers([]);
        if (groupID === 'new' || groupID === undefined) {
            return;
        }
        const { Members: groupMembers } = await api(getGroupMembers(groupID));
        setGroupMembers(groupMembers);
    };

    const handleReloadGroupMembers = async (groupID: string) => {
        fetchGroupMembers(groupID);
    };

    const handleDeleteGroupMember = async (memberId: string) => {
        await api(deleteGroupMember(memberId));
    };

    return {
        fetchGroupMembers,
        groupMembers,
        handleReloadGroupMembers,
        handleDeleteGroupMember,
    };
};

export default useGroupMembers;
