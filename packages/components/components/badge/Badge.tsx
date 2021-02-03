import React from 'react';
import Tooltip from '../tooltip/Tooltip';
import { classnames } from '../../helpers';

const CLASSNAMES = {
    success: 'badge-label--success',
    default: 'badge-label',
    origin: 'badge-label--grey',
    light: 'badge-label--greylight',
    warning: 'badge-label--warning',
    error: 'badge-label--error',
    primary: 'badge-label--primary',
} as const;

const wrapTooltip = (children: React.ReactNode, title: string, className?: string) => (
    <Tooltip title={title} className={className}>
        {children}
    </Tooltip>
);

export interface Props {
    children: React.ReactNode;
    className?: string;
    tooltip?: string;
    type?: keyof typeof CLASSNAMES;
}

const Badge = ({ children, type = 'default', tooltip, className = 'mr1' }: Props) => {
    let badge = <span className={classnames([CLASSNAMES[type], !tooltip && className])}>{children}</span>;

    if (tooltip) {
        badge = wrapTooltip(badge, tooltip, className);
    }

    return badge;
};

export default Badge;
