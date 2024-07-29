import { Scroll } from '@proton/atoms/Scroll';
import { useMembers } from '@proton/components/hooks';
import type { GroupMember } from '@proton/shared/lib/interfaces';

import { GroupMemberItem } from './GroupMemberItem';

interface Props {
    groupMembers: GroupMember[];
}

const GroupMemberList = ({ groupMembers }: Props) => {
    const [members] = useMembers();

    return (
        <>
            <Scroll>
                {groupMembers.map((memberData: GroupMember) => {
                    const memberName = members?.find((member) => member.ID === memberData.ID)?.Name ?? '?';
                    return <GroupMemberItem groupMember={memberData} memberName={memberName}></GroupMemberItem>;
                })}
            </Scroll>
        </>
    );
};

export default GroupMemberList;
