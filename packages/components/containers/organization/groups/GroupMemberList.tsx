import { c, msgid } from 'ttag';

import { Scroll } from '@proton/atoms/Scroll';
import { Loader } from '@proton/components';
import { useMembers } from '@proton/components/hooks';
import type { GroupMember } from '@proton/shared/lib/interfaces';

import { GroupMemberItem } from './GroupMemberItem';

interface Props {
    groupMembers: GroupMember[];
    loading: boolean;
}

const GroupMemberList = ({ groupMembers, loading }: Props) => {
    const [members] = useMembers();

    if (loading) {
        return <Loader />;
    }

    const memberCount = groupMembers.length;

    return (
        <>
            <p className="color-weak text-sm p-0">
                {c('Group member count').ngettext(msgid`${memberCount} member`, `${memberCount} members`, memberCount)}
            </p>
            <Scroll>
                {groupMembers.map((memberData: GroupMember) => {
                    const memberName = members?.find(({ Addresses }) =>
                        Addresses?.some(({ ID }) => ID === (memberData?.AddressID ?? memberData?.AddressId))
                    )?.Name;
                    return <GroupMemberItem groupMember={memberData} memberName={memberName}></GroupMemberItem>;
                })}
            </Scroll>
        </>
    );
};

export default GroupMemberList;
