import React from 'react';
import { Tooltip, classnames } from '../../index';

const CLASSNAMES = {
    success: 'badgeLabel-success',
    default: 'badgeLabel',
    origin: 'badgeLabel-grey',
    warning: 'badgeLabel-warning',
    error: 'badgeLabel-error',
    primary: 'badgeLabel-primary',
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
