import { c } from 'ttag';

import { Avatar } from '@proton/atoms';
import { getInitials } from '@proton/shared/lib/helpers/string';
import clsx from '@proton/utils/clsx';

import { getFormattedCreateTime } from './date';

export const ContactCell = ({
    name,
    email,
    formatted,
    createdAtDate,
}: {
    name: string;
    email: string;
    formatted: string;
    createdAtDate: Date;
}) => {
    const value = name || email;
    const initials = getInitials(value);
    const formattedDate = getFormattedCreateTime(createdAtDate);
    return (
        <div className="flex flex-nowrap items-center gap-2">
            <Avatar color="weak">{initials}</Avatar>
            <div className="flex-1">
                <div className="text-ellipsis" data-testid="delegated-access:username" title={formatted}>
                    {value}
                </div>
                <div>
                    {name && (
                        <span
                            data-testid="delegated-access:email"
                            className={clsx('block text-sm text-ellipsis', name && 'color-weak')}
                            title={email}
                        >
                            {email}
                        </span>
                    )}
                    <span className="block text-sm color-weak">{c('emergency_access')
                        .t`Added on ${formattedDate}`}</span>
                </div>
            </div>
        </div>
    );
};
