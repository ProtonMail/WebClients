import type { ComponentPropsWithoutRef } from 'react';

import Badge from '@proton/components/components/badge/Badge';

const UserTableBadge = ({
    children,
    className,
    type,
    tooltip,
    ...rest
}: ComponentPropsWithoutRef<'div'> & {
    tooltip?: string;
    type: 'weak' | 'success' | 'info' | 'warning' | 'error';
}) => {
    return (
        <Badge type={type === 'weak' ? 'origin' : type} tooltip={tooltip} className="" {...rest}>
            {children}
        </Badge>
    );
};

export default UserTableBadge;
