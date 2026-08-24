import { useState } from 'react';

import type { Group, MemberReadyForManualUnprivatization } from '@proton/shared/lib/interfaces';
import type { GroupMember } from '@proton/shared/lib/interfaces/GroupMember';

import useModalState from '../../components/modalTwo/useModalState';
import ScimSetupBanner from './ScimSetupBanner';
import ScimSetupModal from './ScimSetupModal';
import type { PendingGroupItem, PendingUserItem } from './useScimSetupData';
import useScimSetupData, { ItemStatus } from './useScimSetupData';

interface FrozenData {
    users: MemberReadyForManualUnprivatization[];
    groups: Group[];
    pendingMembersByGroup: Record<string, GroupMember[]>;
}

const ScimSetupBannerAndModal = () => {
    const {
        isEnabled,
        pendingUsers,
        pendingGroups,
        pendingMembersByGroup,
        phase,
        userStatuses,
        groupStatuses,
        groupMemberStatuses,
        approvePendingChanges,
    } = useScimSetupData();

    const [modalProps, setOpen, render] = useModalState();
    const [frozenData, setFrozenData] = useState<FrozenData | null>(null);

    if (!isEnabled || (!pendingUsers.length && !pendingGroups.length && !render)) {
        return null;
    }

    const handleOpen = () => {
        setFrozenData({ users: pendingUsers, groups: pendingGroups, pendingMembersByGroup });
        setOpen(true);
    };

    const modalUsers: PendingUserItem[] = (frozenData?.users ?? []).map((member) => ({
        member,
        status: userStatuses[member.ID] ?? ItemStatus.Unknown,
    }));

    const modalGroups: PendingGroupItem[] = (frozenData?.groups ?? []).map((group) => ({
        group,
        status: groupStatuses[group.ID] ?? ItemStatus.Unknown,
        members: (frozenData?.pendingMembersByGroup[group.ID] ?? []).map((member) => ({
            member,
            status: groupMemberStatuses[member.ID] ?? ItemStatus.Unknown,
        })),
    }));

    return (
        <>
            {(pendingUsers.length > 0 || pendingGroups.length > 0) && (
                <ScimSetupBanner
                    pendingUsersCount={pendingUsers.length}
                    pendingGroupsCount={pendingGroups.length}
                    onReviewChanges={handleOpen}
                />
            )}
            {render && frozenData && (
                <ScimSetupModal
                    {...modalProps}
                    users={modalUsers}
                    groups={modalGroups}
                    pendingMembers={frozenData.pendingMembersByGroup}
                    phase={phase}
                    onFinish={() => approvePendingChanges(frozenData.users, frozenData.groups)}
                />
            )}
        </>
    );
};

export default ScimSetupBannerAndModal;
