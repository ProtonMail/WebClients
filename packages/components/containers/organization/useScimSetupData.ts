import { useEffect, useState } from 'react';

import { useGetGroupMembers } from '@proton/account/groupMembers/hooks';
import { getIsScimGroup } from '@proton/account/groups/groupFlags';
import { useGroups } from '@proton/account/groups/hooks';
import {
    ItemStatus,
    Phase,
    selectPendingScimGroups,
    selectPendingScimMembersByGroup,
    selectPendingScimUsers,
} from '@proton/account/scimSetup';
import { type ScimProgress, approveScimChanges } from '@proton/account/scimSetup/actions';
import useApi from '@proton/components/hooks/useApi';
import useErrorHandler from '@proton/components/hooks/useErrorHandler';
import { useDispatch, useSelector } from '@proton/redux-shared-store/sharedProvider';
import type { Group, MemberReadyForManualUnprivatization } from '@proton/shared/lib/interfaces';
import type { GroupMember } from '@proton/shared/lib/interfaces/GroupMember';
import { useFlag } from '@proton/unleash/useFlag';

import useGroupKeys from './groups/useGroupKeys';

export { ItemStatus, Phase };

export interface PendingUserItem {
    member: MemberReadyForManualUnprivatization;
    status: ItemStatus;
}

interface PendingGroupMemberItem {
    member: GroupMember;
    status: ItemStatus;
}

export interface PendingGroupItem {
    group: Group;
    members: PendingGroupMemberItem[];
    status: ItemStatus;
}

const useScimSetupData = () => {
    const isEnabled = useFlag('UserGroupsGroupOwner');

    const [phase, setPhase] = useState<Phase>(Phase.Idle);
    const [userStatuses, setUserStatuses] = useState<Record<string, ItemStatus>>({});
    const [groupStatuses, setGroupStatuses] = useState<Record<string, ItemStatus>>({});
    const [groupMemberStatuses, setGroupMemberStatuses] = useState<Record<string, ItemStatus>>({});

    const pendingUsers = useSelector(selectPendingScimUsers);
    const pendingGroups = useSelector(selectPendingScimGroups);
    const pendingMembersByGroup = useSelector(selectPendingScimMembersByGroup);

    const getGroupMembers = useGetGroupMembers();
    const [groups] = useGroups();

    const api = useApi();
    const dispatch = useDispatch();
    const handleError = useErrorHandler();

    const { getMemberPublicKeys } = useGroupKeys();

    // TODO: add a way to know how many group members need to be activated per group
    useEffect(() => {
        for (const group of groups ?? []) {
            if (getIsScimGroup(group)) {
                void getGroupMembers(group.ID);
            }
        }
    }, [groups]);

    const applyScimProgress = (update: ScimProgress) => {
        switch (update.type) {
            case 'phase':
                setPhase(update.phase);
                break;
            case 'initStatuses':
                setUserStatuses(update.userStatuses);
                setGroupStatuses(update.groupStatuses);
                setGroupMemberStatuses(update.groupMemberStatuses);
                break;
            case 'userStatuses':
                setUserStatuses(update.statuses);
                break;
            case 'groupStatus':
                setGroupStatuses((prev) => ({ ...prev, [update.groupID]: update.status }));
                break;
            case 'groupMemberStatus':
                setGroupMemberStatuses((prev) => ({ ...prev, [update.memberID]: update.status }));
                break;
            case 'error':
                handleError(update.error);
                break;
        }
    };

    const approvePendingChanges = async (
        usersToApprove: MemberReadyForManualUnprivatization[],
        groupsToApprove: Group[]
    ) => {
        for await (const update of approveScimChanges({
            usersToApprove,
            groupsToApprove,
            pendingMembersByGroup,
            api,
            getMemberPublicKeys,
            dispatch,
        })) {
            applyScimProgress(update);
        }
    };

    return {
        isEnabled,
        phase,
        pendingUsers,
        pendingGroups,
        pendingMembersByGroup,
        userStatuses,
        groupStatuses,
        groupMemberStatuses,
        approvePendingChanges,
    };
};

export default useScimSetupData;
