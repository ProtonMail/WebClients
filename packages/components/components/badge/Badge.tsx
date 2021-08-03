import * as React from 'react';
import Tooltip from '../tooltip/Tooltip';
import { classnames } from '../../helpers';

const CLASSNAMES = {
    default: 'badge-label-norm',
    origin: 'badge-label-strong',
    light: 'badge-label-weak',
    primary: 'badge-label-primary',
    error: 'badge-label-danger',
    warning: 'badge-label-warning',
    success: 'badge-label-success',
    info: 'badge-label-info',
} as const;

export interface Props {
    children: React.ReactNode;
    className?: string;
    tooltip?: string;
    type?: keyof typeof CLASSNAMES;
}

const Badge = ({ children, type = 'default', tooltip, className = 'mr1' }: Props) => {
    const badge = <span className={classnames([CLASSNAMES[type], className])}>{children}</span>;

    if (tooltip) {
        return <Tooltip title={tooltip}>{badge}</Tooltip>;
    }

    return badge;
};

export default Badge;
