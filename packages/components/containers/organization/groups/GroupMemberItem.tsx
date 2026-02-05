import { c } from 'ttag';

import Badge from '@proton/components/components/badge/Badge';
import { hasBit } from '@proton/shared/lib/helpers/bitset';
import type { EnhancedMember, Group, GroupMember } from '@proton/shared/lib/interfaces';
import { GROUP_MEMBER_PERMISSIONS, GROUP_MEMBER_STATE } from '@proton/shared/lib/interfaces';
import { useFlag } from '@proton/unleash/index';

import GroupMemberItemDropdown from './GroupMemberItemDropdown';
import { GroupMemberItemWrapper } from './components/GroupMemberItemWrapper';

type InvitationBadgeMap = Partial<{
    [key in GROUP_MEMBER_STATE]: { label: string; tooltip: string };
}>;

const getInvitationBadgeMap = (): InvitationBadgeMap => ({
    [GROUP_MEMBER_STATE.PENDING]: {
        label: c('invitation status').t`Pending`,
        tooltip: c('tooltip').t`Waiting for user to accept the invitation`,
    },
    [GROUP_MEMBER_STATE.REJECTED]: {
        label: c('invitation status').t`Declined`,
        tooltip: c('tooltip').t`User declined invitation`,
    },
    [GROUP_MEMBER_STATE.PAUSED]: {
        label: c('invitation status').t`Paused`,
        tooltip: c('tooltip').t`Group membership paused`,
    },
});

interface Props {
    groupMember: GroupMember;
    member?: EnhancedMember;
    group: Group; // needs to be removed once GroupMemberItemDropdown does not need it
    canOnlyDelete: boolean;
    canChangeVisibility: boolean;
}

export const GroupMemberItem = ({
    groupMember,
    groupMember: { Email, State },
    member,
    group,
    canOnlyDelete,
    canChangeVisibility,
}: Props) => {
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
            >
                <div className="flex flex-row gap-2 flex-nowrap self-center">
                    {badge && (
                        <span>
                            <Badge type="origin" className="rounded-sm color-weak" tooltip={badge.tooltip}>
                                {badge.label}
                            </Badge>
                        </span>
                    )}
                    {isGroupOwnerEnabled && isGroupOwner && (
                        <Badge
                            type="origin"
                            className="rounded-sm color-weak"
                            tooltip={c('tooltip').t`User is a group`}
                        >
                            {c('invitation status').t`Owner`}
                        </Badge>
                    )}
                </div>
                <div>
                    <GroupMemberItemDropdown
                        groupMember={groupMember}
                        member={member}
                        group={group}
                        canOnlyDelete={canOnlyDelete}
                        canChangeVisibility={canChangeVisibility}
                    />
                </div>
            </GroupMemberItemWrapper>
        </>
    );
};
