import { c, msgid } from 'ttag';

import { Scroll } from '@proton/atoms/Scroll';
import { Loader } from '@proton/components';
import { useMembers } from '@proton/components/hooks';
import type { Group, GroupMember } from '@proton/shared/lib/interfaces';

import { GroupMemberItem } from './GroupMemberItem';

interface Props {
    groupMembers: GroupMember[];
    loading: boolean;
    group: Group | undefined; // needs to be removed once GroupMemberItem doesn't need it
    edit?: boolean;
}

const compareMemberNames = (a: GroupMember, b: GroupMember) => a.Email.localeCompare(b.Email);
const getSortedMembers = (members: GroupMember[]) => {
    return [...members].sort(compareMemberNames);
};

const GroupMemberList = ({ groupMembers, loading, group, edit = false }: Props) => {
    const [members] = useMembers();

    const sortedMembers = getSortedMembers(groupMembers);

    if (loading || group === undefined) {
        return <Loader />;
    }

    const memberCount = groupMembers.length;

    return (
        <>
            {!edit && (
                <p className="color-weak text-sm p-0">
                    {c('Group member count').ngettext(
                        msgid`${memberCount} member`,
                        `${memberCount} members`,
                        memberCount
                    )}
                </p>
            )}
            <Scroll>
                <div className="flex flex-column gap-3">
                    {sortedMembers.map((memberData: GroupMember) => {
                        const memberName = members?.find(({ Addresses }) =>
                            Addresses?.some(({ ID }) => ID === (memberData?.AddressID ?? memberData?.AddressId))
                        )?.Name;
                        return <GroupMemberItem groupMember={memberData} memberName={memberName} group={group} />;
                    })}
                </div>
            </Scroll>
        </>
    );
};

export default GroupMemberList;
