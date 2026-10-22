import { useState } from 'react';

import type { Group } from '@proton/shared/lib/interfaces/Group';
import type { GroupMember } from '@proton/shared/lib/interfaces/GroupMember';
import type { EnhancedMember, MemberReadyForManualUnprivatization } from '@proton/shared/lib/interfaces/Member';

import useModalState from '../../components/modalTwo/useModalState';
import ScimSetupBanner from './ScimSetupBanner';
import ScimSetupModal from './ScimSetupModal';
import type { PendingCleanUpItem, PendingGroupItem, PendingUserItem } from './useScimSetupData';
import useScimSetupData, { ItemStatus } from './useScimSetupData';

interface FrozenData {
    users: MemberReadyForManualUnprivatization[];
    groups: Group[];
    pendingMembersByGroup: Record<string, GroupMember[]>;
    membersRequiringOrgKeyDemotion: EnhancedMember[];
}

const ScimSetupBannerAndModal = () => {
    const {
        isEnabled,
        pendingUsers,
        pendingGroups,
        pendingMembersByGroup,
        membersRequiringOrgKeyDemotion,
        phase,
        userStatuses,
        groupStatuses,
        groupMemberStatuses,
        approvePendingChanges,
        orgKeyDemotionStatuses,
        resetApproval,
    } = useScimSetupData();

    const [modalProps, setOpen, render] = useModalState();
    const [frozenData, setFrozenData] = useState<FrozenData | null>(null);

    if (
        !isEnabled ||
        (!pendingUsers.length && !pendingGroups.length && !membersRequiringOrgKeyDemotion.length && !render)
    ) {
        return null;
    }

    const handleOpen = () => {
        setFrozenData({
            users: pendingUsers,
            groups: pendingGroups,
            pendingMembersByGroup,
            membersRequiringOrgKeyDemotion,
        });
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

    const modalCleanUps: PendingCleanUpItem[] = (frozenData?.membersRequiringOrgKeyDemotion ?? []).map((member) => ({
        member,
        status: orgKeyDemotionStatuses[member.ID] ?? ItemStatus.Completed,
    }));

    return (
        <>
            {(pendingUsers.length > 0 || pendingGroups.length > 0 || membersRequiringOrgKeyDemotion.length > 0) && (
                <ScimSetupBanner
                    pendingUsersCount={pendingUsers.length}
                    pendingGroupsCount={pendingGroups.length}
                    cleanUpCount={membersRequiringOrgKeyDemotion.length}
                    onReviewChanges={handleOpen}
                />
            )}
            {render && frozenData && (
                <ScimSetupModal
                    {...modalProps}
                    onExit={() => {
                        modalProps.onExit();
                        resetApproval();
                    }}
                    users={modalUsers}
                    groups={modalGroups}
                    cleanUps={modalCleanUps}
                    pendingMembers={frozenData.pendingMembersByGroup}
                    phase={phase}
                    onFinish={() =>
                        approvePendingChanges(
                            frozenData.users,
                            frozenData.groups,
                            frozenData.membersRequiringOrgKeyDemotion
                        )
                    }
                />
            )}
        </>
    );
};

export default ScimSetupBannerAndModal;
