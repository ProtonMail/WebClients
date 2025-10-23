import { useMemo } from 'react';

import { c, msgid } from 'ttag';

import { Scroll } from '@proton/atoms/Scroll/Scroll';
import Loader from '@proton/components/components/loader/Loader';
import type { Group, GroupMember } from '@proton/shared/lib/interfaces';

import { GroupMemberItem } from './GroupMemberItem';
import type { GroupsManagementReturn } from './types';

interface Props {
    addressToMemberMap: GroupsManagementReturn['addressToMemberMap'];
    groupMembers: GroupMember[];
    loading: boolean;
    group: Group | undefined; // needs to be removed once GroupMemberItem doesn't need it
    edit?: boolean;
    canOnlyDelete: boolean;
    canChangeVisibility: boolean;
}

const compareMemberNames = (a: GroupMember, b: GroupMember) => {
    return a.Email?.localeCompare(b?.Email ?? '') ?? 0;
};
const getSortedGroupMembers = (members: GroupMember[]) => {
    return [...members].sort(compareMemberNames);
};

const GroupMemberList = ({
    addressToMemberMap,
    groupMembers,
    loading,
    group,
    edit = false,
    canOnlyDelete,
    canChangeVisibility,
}: Props) => {
    const sortedGroupMembers = useMemo(() => getSortedGroupMembers(groupMembers), [groupMembers]);

    if (loading) {
        return <Loader />;
    }

    if (!group) {
        return null;
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
                    {sortedGroupMembers.map((memberData: GroupMember) => {
                        const member = addressToMemberMap[memberData?.AddressID ?? memberData?.AddressId ?? ''];
                        const memberName = member?.Name ?? '';
                        return (
                            <GroupMemberItem
                                key={memberData.ID}
                                group={group}
                                groupMember={memberData}
                                memberName={memberName}
                                canOnlyDelete={canOnlyDelete}
                                canChangeVisibility={canChangeVisibility}
                            />
                        );
                    })}
                </div>
            </Scroll>
        </>
    );
};

export default GroupMemberList;
