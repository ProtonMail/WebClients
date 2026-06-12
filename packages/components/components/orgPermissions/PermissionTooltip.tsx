import type { ReactNode } from 'react';

import { c } from 'ttag';

import { Tooltip, type Props as TooltipProps } from '@proton/atoms/Tooltip/Tooltip';

export interface Props extends Omit<TooltipProps, 'children' | 'title'> {
    hasPermission: boolean;
    children: ReactNode;
    openDelay?: number;
    className?: string;
    wrapperClassName?: string;
}

const PermissionTooltip = ({
    hasPermission,
    children,
    openDelay = 100,
    className,
    wrapperClassName,
    ...rest
}: Props) => (
    <Tooltip
        {...rest}
        title={hasPermission ? undefined : c('Label').t`You don't have permissions`}
        openDelay={openDelay}
        tooltipClassName={className}
    >
        <span className={wrapperClassName}>{children}</span>
    </Tooltip>
);

export default PermissionTooltip;
