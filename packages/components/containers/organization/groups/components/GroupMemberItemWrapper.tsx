import type { ReactNode } from 'react';

import { Avatar } from '@proton/atoms';
import { getInitials } from '@proton/shared/lib/helpers/string';

interface Props {
    memberEmail: string;
    memberName: string;
    children?: ReactNode;
}

export const GroupMemberItemWrapper = ({ memberEmail, memberName, children }: Props) => {
    return (
        <>
            <div className="flex gap-3 items-center">
                <Avatar className="shrink-0 text-rg" color="weak">
                    {getInitials(memberName ?? memberEmail ?? '')}
                </Avatar>
                <span className="flex-1 flex flex-column justify-center">
                    <span className="block max-w-full text-ellipsis" title={memberName}>
                        {memberName}
                    </span>
                    {memberName !== memberEmail && (
                        <span className="color-weak text-sm block max-w-full text-ellipsis" title={memberEmail}>
                            {memberEmail}
                        </span>
                    )}
                </span>
                {children}
            </div>
        </>
    );
};
