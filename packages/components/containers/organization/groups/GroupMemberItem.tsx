import { c } from 'ttag';

import { Badge } from '@proton/components/components';
import { Icon } from '@proton/components/components';
import type { Group, GroupMember } from '@proton/shared/lib/interfaces';
import { GROUP_MEMBER_STATE } from '@proton/shared/lib/interfaces';

import GroupMemberItemDropdown from './GroupMemberItemDropdown';
import { GroupMemberItemWrapper } from './components/GroupMemberItemWrapper';

interface Props {
    groupMember: GroupMember;
    memberName?: string;
    group: Group; // needs to be removed once GroupMemberItemDropdown does not need it
}

export const GroupMemberItem = ({
    groupMember,
    groupMember: { Email, State, AddressID },
    memberName,
    group,
}: Props) => {
    const isInvitationPending = State === GROUP_MEMBER_STATE.PENDING;
    const isRejected = State === GROUP_MEMBER_STATE.REJECTED;
    const hasKeys = !!AddressID;

    return (
        <>
            <GroupMemberItemWrapper memberEmail={Email} memberName={memberName ?? Email}>
                <div className="flex flex-row gap-2 flex-nowrap self-center">
                    {hasKeys && (
                        <span className="shrink-0 flex mt-0.5">
                            <Icon name="lock" alt={c('Info').t`Internal user`} />
                        </span>
                    )}
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
                                type="origin"
                                className="rounded-sm color-weak"
                                tooltip={c('tooltip').t`User declined invitation`}
                            >{c('invitation status').t`Declined`}</Badge>
                        </span>
                    )}
                </div>
                <div>
                    <GroupMemberItemDropdown member={groupMember} group={group} />
                </div>
            </GroupMemberItemWrapper>
        </>
    );
};
