import { c } from 'ttag';

import { Avatar } from '@proton/atoms/Avatar';
import { Badge } from '@proton/components/components';
import { getInitials } from '@proton/shared/lib/helpers/string';
import type { GroupMember } from '@proton/shared/lib/interfaces';
import { GROUP_MEMBER_STATE } from '@proton/shared/lib/interfaces';

import GroupMemberItemDropdown from './GroupMemberItemDropdown';

interface Props {
    groupMember: GroupMember;
    memberName: string;
}

export const GroupMemberItem = ({ groupMember, memberName }: Props) => {
    const isInvitationPending = groupMember.State === GROUP_MEMBER_STATE.PENDING;

    return (
        <>
            <div className="flex gap-3">
                <Avatar className="shrink-0 text-rg" color="weak">
                    {getInitials(memberName)}
                </Avatar>
                <div className="text-ellipsis flex-1">
                    {memberName}
                    <div className="color-weak text-sm">{groupMember.Email}</div>
                </div>
                <div className="flex flex-column flex-nowrap self-center">
                    {isInvitationPending && (
                        <span>
                            <Badge
                                type="origin"
                                className="rounded-sm color-weak"
                                tooltip={c('tooltip').t`Waiting user to accept the invitation`}
                            >{c('invitation status').t`Pending`}</Badge>
                        </span>
                    )}
                </div>
                <GroupMemberItemDropdown member={groupMember} />
            </div>
        </>
    );
};
