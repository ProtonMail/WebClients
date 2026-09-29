import type { ReactNode } from 'react';

import { Avatar } from '@proton/atoms/Avatar/Avatar';
import { getInitials } from '@proton/shared/lib/helpers/string';
import type { GROUP_MEMBER_TYPE } from '@proton/shared/lib/interfaces';
import clsx from '@proton/utils/clsx';

import UserIsExternalIcon from '../../UserIsExternalIcon';

interface Props {
    memberEmail: string | null;
    memberName: string | null;
    groupMemberType: GROUP_MEMBER_TYPE;
    showMailFeatures: boolean;
    children?: ReactNode;
    isMemberDisabled?: boolean;
    showCannotPromoteWarning: boolean;
}

export const GroupMemberItemWrapper = ({
    memberEmail,
    memberName,
    groupMemberType,
    showMailFeatures,
    children,
    isMemberDisabled,
    showCannotPromoteWarning,
}: Props) => {
    return (
        <>
            <div className="flex shrink-0 gap-3 items-center">
                <Avatar className="shrink-0 text-rg text-semibold" color="weak">
                    {getInitials(memberName || memberEmail || '')}
                </Avatar>
                <span className="flex flex-1 items-center">
                    <span className="flex flex-column justify-center mr-1">
                        <span
                            className={clsx('block text-ellipsis', isMemberDisabled && 'color-disabled')}
                            title={memberName || ''}
                        >
                            {memberName}
                        </span>
                        {memberName !== memberEmail && (
                            <span
                                className={clsx(
                                    'text-sm block text-ellipsis',
                                    isMemberDisabled ? 'color-disabled' : 'color-weak'
                                )}
                                title={memberEmail || ''}
                            >
                                {memberEmail}
                            </span>
                        )}
                    </span>
                    <UserIsExternalIcon
                        groupMemberType={groupMemberType}
                        showMailWarning={showMailFeatures}
                        showCannotPromoteWarning={showCannotPromoteWarning}
                    />
                </span>
                {children}
            </div>
        </>
    );
};
