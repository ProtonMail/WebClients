import { ReactNode } from 'react';
import Tooltip from '../tooltip/Tooltip';
import { classnames } from '../../helpers';
import { Href } from '../link';

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

export type BadgeType = keyof typeof CLASSNAMES;

export interface Props {
    children: ReactNode;
    className?: string;
    tooltip?: string;
    url?: string;
    type?: BadgeType;
}

const Badge = ({ children, type = 'default', url, tooltip, className = 'mr1' }: Props) => {
    const badge = <span className={classnames([CLASSNAMES[type], className])}>{children}</span>;
    const wrappedBadge = url ? (
        <Href url={url} className="text-no-decoration">
            {badge}
        </Href>
    ) : (
        badge
    );

    if (tooltip) {
        return <Tooltip title={tooltip}>{wrappedBadge}</Tooltip>;
    }

    return wrappedBadge;
};

export default Badge;
