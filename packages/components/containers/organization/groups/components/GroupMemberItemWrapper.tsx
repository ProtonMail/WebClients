import type { ReactNode } from 'react';

import { Avatar } from '@proton/atoms';
import { getInitials } from '@proton/shared/lib/helpers/string';
import { GROUP_MEMBER_TYPE } from '@proton/shared/lib/interfaces';

import UserIsExternalIcon from '../../UserIsExternalIcon';

interface Props {
    memberEmail: string | null;
    memberName: string | null;
    groupMemberType: GROUP_MEMBER_TYPE;
    children?: ReactNode;
}

export const GroupMemberItemWrapper = ({ memberEmail, memberName, groupMemberType, children }: Props) => {
    const mailE2EEDisabled = groupMemberType !== GROUP_MEMBER_TYPE.INTERNAL;
    return (
        <>
            <div className="flex gap-3 items-center">
                <Avatar className="shrink-0 text-rg" color="weak">
                    {getInitials(memberName ?? memberEmail ?? '')}
                </Avatar>
                <span className="flex-1 flex flex-column justify-center">
                    <span className="block max-w-full text-ellipsis" title={memberName || ''}>
                        {memberName}
                    </span>
                    {memberName !== memberEmail && (
                        <span className="color-weak text-sm block max-w-full text-ellipsis" title={memberEmail || ''}>
                            {memberEmail}
                        </span>
                    )}
                </span>
                {mailE2EEDisabled && <UserIsExternalIcon groupMemberType={groupMemberType} />}
                {children}
            </div>
        </>
    );
};
