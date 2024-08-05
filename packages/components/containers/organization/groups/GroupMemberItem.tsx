import { c } from 'ttag';

import { Badge } from '@proton/components/components';
import type { GroupMember } from '@proton/shared/lib/interfaces';
import { GROUP_MEMBER_STATE } from '@proton/shared/lib/interfaces';

import GroupMemberItemDropdown from './GroupMemberItemDropdown';
import { GroupMemberItemWrapper } from './components/GroupMemberItemWrapper';

interface Props {
    groupMember: GroupMember;
    memberName?: string;
}

export const GroupMemberItem = ({ groupMember, memberName }: Props) => {
    const { Email } = groupMember;
    const isInvitationPending = groupMember.State === GROUP_MEMBER_STATE.PENDING;
    const isRejected = groupMember.State === GROUP_MEMBER_STATE.REJECTED;

    return (
        <>
            <GroupMemberItemWrapper memberEmail={Email} memberName={memberName ?? Email}>
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
                    {isRejected && (
                        <span>
                            <Badge
                                type="warning"
                                className="rounded-sm color-danger"
                                tooltip={c('tooltip').t`User rejected invitation`}
                            >{c('invitation status').t`Rejected`}</Badge>
                        </span>
                    )}
                </div>
                <GroupMemberItemDropdown member={groupMember} />
            </GroupMemberItemWrapper>
        </>
    );
};
