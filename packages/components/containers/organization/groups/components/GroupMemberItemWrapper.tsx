import type { ReactNode } from 'react';

import { Avatar } from '@proton/atoms/Avatar/Avatar';
import { getInitials } from '@proton/shared/lib/helpers/string';
import { GROUP_MEMBER_TYPE } from '@proton/shared/lib/interfaces';

import UserIsExternalIcon from '../../UserIsExternalIcon';

interface Props {
    memberEmail: string | null;
    memberName: string | null;
    groupMemberType: GROUP_MEMBER_TYPE;
    showMailFeatures: boolean;
    children?: ReactNode;
}

export const GroupMemberItemWrapper = ({
    memberEmail,
    memberName,
    groupMemberType,
    showMailFeatures,
    children,
}: Props) => {
    const mailE2EEDisabled = groupMemberType !== GROUP_MEMBER_TYPE.INTERNAL;
    return (
        <>
            <div className="flex shrink-0 gap-3 items-center">
                <Avatar className="shrink-0 text-rg text-semibold" color="weak">
                    {getInitials(memberName || memberEmail || '')}
                </Avatar>
                <span className="flex flex-1 items-center">
                    <span className="flex flex-column justify-center mr-1">
                        <span className="block text-ellipsis" title={memberName || ''}>
                            {memberName}
                        </span>
                        {memberName !== memberEmail && (
                            <span className="color-weak text-sm block text-ellipsis" title={memberEmail || ''}>
                                {memberEmail}
                            </span>
                        )}
                    </span>
                    {showMailFeatures && mailE2EEDisabled && <UserIsExternalIcon groupMemberType={groupMemberType} />}
                </span>
                {children}
            </div>
        </>
    );
};
