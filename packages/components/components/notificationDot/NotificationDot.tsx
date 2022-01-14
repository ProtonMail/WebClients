import { HTMLAttributes } from 'react';
import { classnames } from '../../helpers/component';
import './NotificationDot.scss';

export type NotificationDotColor = 'warning' | 'danger';

interface Props extends HTMLAttributes<HTMLElement> {
    color: NotificationDotColor;
}

const NotificationDot = ({ color, className, ...rest }: Props) => {
    return <span className={classnames([className, `notification-dot bg-${color} rounded-50`])} {...rest} />;
};

export default NotificationDot;
