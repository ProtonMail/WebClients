import { useState } from 'react';

import { useApi } from '@proton/components';
import { useErrorHandler } from '@proton/components';
import { deleteGroupMember, getGroupMembers } from '@proton/shared/lib/api/groups';
import type { GroupMember } from '@proton/shared/lib/interfaces';

const useGroupMembers = () => {
    const [groupMembers, setGroupMembers] = useState<GroupMember[]>([]);
    const api = useApi();
    const handleError = useErrorHandler();

    const fetchGroupMembers = async (groupID?: string) => {
        if (groupID === 'new' || groupID === undefined) {
            setGroupMembers([]);
            return;
        }

        try {
            const { Members: groupMembers } = await api(getGroupMembers(groupID));
            setGroupMembers(groupMembers);
        } catch (error) {
            // TODO: add better error handling
            handleError(error);
        }
    };

    const handleReloadGroupMembers = async (groupID: string) => {
        try {
            await fetchGroupMembers(groupID);
        } catch (error) {
            handleError(error);
        }
    };

    const handleDeleteGroupMember = async (memberId: string) => {
        try {
            await api(deleteGroupMember(memberId));
        } catch (error) {
            handleError(error);
        }
    };

    return {
        fetchGroupMembers,
        groupMembers,
        handleReloadGroupMembers,
        handleDeleteGroupMember,
        setGroupMembers,
    };
};

export default useGroupMembers;
