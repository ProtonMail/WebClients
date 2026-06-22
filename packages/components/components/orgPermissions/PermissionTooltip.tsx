import { type ReactNode, forwardRef } from 'react';

import { c } from 'ttag';

import { Tooltip, type Props as TooltipProps } from '@proton/atoms/Tooltip/Tooltip';

export interface Props extends Omit<TooltipProps, 'children' | 'title'> {
    hasPermission: boolean;
    children: ReactNode;
    openDelay?: number;
    className?: string;
    wrapperClassName?: string;
}

const PermissionTooltip = forwardRef<HTMLElement, Props>(
    ({ hasPermission, children, openDelay = 100, className, wrapperClassName, ...rest }, ref) => (
        <Tooltip
            ref={ref}
            {...rest}
            title={hasPermission ? undefined : c('Label').t`You don't have permissions`}
            openDelay={openDelay}
            tooltipClassName={className}
        >
            <span className={wrapperClassName}>{children}</span>
        </Tooltip>
    )
);

PermissionTooltip.displayName = 'PermissionTooltip';

export default PermissionTooltip;
