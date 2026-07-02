import { c } from 'ttag';

import { hasBit } from '@proton/shared/lib/helpers/bitset';
import type { EnhancedMember, Group, GroupMember } from '@proton/shared/lib/interfaces';
import { GROUP_MEMBER_PERMISSIONS, GROUP_MEMBER_STATE } from '@proton/shared/lib/interfaces';
import { useFlag } from '@proton/unleash/useFlag';

import { MemberStateInfo } from '../MemberStateInfo';
import GroupMemberItemDropdown from './GroupMemberItemDropdown';
import { GroupMemberItemWrapper } from './components/GroupMemberItemWrapper';
import { useGroupsManagement } from './context/GroupsManagementContext';

type InvitationBadgeMap = Partial<{
    [key in GROUP_MEMBER_STATE]: { label: string; tooltip: string; color?: string; backgroundColor?: string };
}>;

const getInvitationBadgeMap = (): InvitationBadgeMap => ({
    [GROUP_MEMBER_STATE.PENDING_ADMIN]: {
        label: c('invitation status').t`Pending`,
        tooltip: c('tooltip').t`Waiting for admin approval`,
        color: 'var(--signal-warning-major-3)',
        backgroundColor: 'var(--signal-warning-minor-2)',
    },
    [GROUP_MEMBER_STATE.PENDING]: {
        label: c('invitation status').t`Invited`,
        tooltip: c('tooltip').t`Waiting for user to accept the invitation`,
        color: 'var(--text-norm)',
        backgroundColor: 'var(--background-weak)',
    },
    [GROUP_MEMBER_STATE.REJECTED]: {
        label: c('invitation status').t`Declined`,
        tooltip: c('tooltip').t`User declined invitation`,
        color: 'var(--text-norm)',
        backgroundColor: 'var(--background-weak)',
    },
    [GROUP_MEMBER_STATE.PAUSED]: {
        label: c('invitation status').t`Paused`,
        tooltip: c('tooltip').t`Group membership paused`,
        color: 'var(--text-norm)',
        backgroundColor: 'var(--background-weak)',
    },
});

interface Props {
    groupMember: GroupMember;
    member?: EnhancedMember;
    group: Group; // needs to be removed once GroupMemberItemDropdown does not need it
    canChangeVisibility: boolean;
    showMailFeatures: boolean;
}

export const GroupMemberItem = ({
    groupMember,
    groupMember: { Email, State },
    member,
    group,
    canChangeVisibility,
    showMailFeatures,
}: Props) => {
    const { isFrozen } = useGroupsManagement();
    const badge = getInvitationBadgeMap()[State];
    const isGroupOwner = hasBit(groupMember.Permissions, GROUP_MEMBER_PERMISSIONS.OWNER);
    const isGroupOwnerEnabled = useFlag('UserGroupsGroupOwner');
    const memberName = member?.Name ?? '';

    return (
        <>
            <GroupMemberItemWrapper
                memberEmail={Email}
                memberName={memberName ?? Email}
                groupMemberType={groupMember.Type}
                showMailFeatures={showMailFeatures}
                isMemberDisabled={groupMember.State === GROUP_MEMBER_STATE.PENDING_ADMIN}
            >
                <div className="flex flex-row gap-2 flex-nowrap self-center">
                    {badge && (
                        <MemberStateInfo
                            title={badge.tooltip}
                            backgroundColor={badge.backgroundColor}
                            color={badge.color}
                        >
                            {badge.label}
                        </MemberStateInfo>
                    )}
                    {isGroupOwnerEnabled && isGroupOwner && (
                        <MemberStateInfo title={c('tooltip').t`User is a group owner`}>
                            {c('invitation status').t`Group Owner`}
                        </MemberStateInfo>
                    )}
                </div>
                <div>
                    <GroupMemberItemDropdown
                        groupMember={groupMember}
                        member={member}
                        group={group}
                        isFrozen={isFrozen}
                        canChangeVisibility={canChangeVisibility}
                    />
                </div>
            </GroupMemberItemWrapper>
        </>
    );
};
