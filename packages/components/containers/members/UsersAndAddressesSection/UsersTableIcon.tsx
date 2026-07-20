import type { ComponentPropsWithoutRef, ReactNode } from 'react';

import { Tooltip } from '@proton/atoms/Tooltip/Tooltip';

const UserTableIcon = ({
    title,
    icon,
    ...rest
}: ComponentPropsWithoutRef<'span'> & {
    title?: string;
    icon: ReactNode;
}) => {
    return (
        <Tooltip title={title} openDelay={0}>
            <span {...rest}>{icon}</span>
        </Tooltip>
    );
};

export default UserTableIcon;
