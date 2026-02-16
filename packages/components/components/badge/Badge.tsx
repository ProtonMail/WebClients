import type { ReactNode } from 'react';

import { Href } from '@proton/atoms/Href/Href';
import { Tooltip } from '@proton/atoms/Tooltip/Tooltip';
import clsx from '@proton/utils/clsx';

export const CLASSNAMES = {
    default: 'badge-label-norm',
    origin: 'badge-label-strong',
    light: 'badge-label-weak',
    primary: 'badge-label-primary',
    error: 'badge-label-danger',
    warning: 'badge-label-warning',
    success: 'badge-label-success',
    info: 'badge-label-info',
} as const;

export type BadgeType = keyof typeof CLASSNAMES;

export interface Props {
    children: ReactNode;
    className?: string;
    tooltip?: ReactNode;
    tooltipOpenDelay?: number;
    url?: string;
    type?: BadgeType;
    'data-testid'?: string;
}

export const Badge = ({
    children,
    type = 'default',
    url,
    tooltip,
    tooltipOpenDelay,
    className = 'mr-2',
    'data-testid': dataTestId,
}: Props) => {
    const badge = (
        <span className={clsx(CLASSNAMES[type], className)} data-testid={dataTestId}>
            {children}
        </span>
    );
    const wrappedBadge = url ? (
        <Href href={url} className="text-no-decoration">
            {badge}
        </Href>
    ) : (
        badge
    );

    if (tooltip) {
        return (
            <Tooltip title={tooltip} openDelay={tooltipOpenDelay}>
                {wrappedBadge}
            </Tooltip>
        );
    }

    return wrappedBadge;
};

export default Badge;
