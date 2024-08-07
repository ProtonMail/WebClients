import { c, msgid } from 'ttag';

import { Scroll } from '@proton/atoms/Scroll';
import { Loader } from '@proton/components';
import { useMembers } from '@proton/components/hooks';
import type { GroupMember } from '@proton/shared/lib/interfaces';

import { GroupMemberItem } from './GroupMemberItem';

interface Props {
    groupMembers: GroupMember[];
    loading: boolean;
    edit?: boolean;
}

const GroupMemberList = ({ groupMembers, loading, edit = false }: Props) => {
    const [members] = useMembers();

    if (loading) {
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
                    {groupMembers &&
                        groupMembers.map((memberData: GroupMember) => {
                            const memberName = members?.find(({ Addresses }) =>
                                Addresses?.some(({ ID }) => ID === (memberData?.AddressID ?? memberData?.AddressId))
                            )?.Name;
                            return <GroupMemberItem groupMember={memberData} memberName={memberName} />;
                        })}
                </div>
            </Scroll>
        </>
    );
};

export default GroupMemberList;
