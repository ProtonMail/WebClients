import { HTMLAttributes } from 'react';
import { classnames } from '../../helpers/component';
import './NotificationDot.scss';

const NotificationDot = ({ className, ...rest }: HTMLAttributes<HTMLElement>) => {
    return <span className={classnames([className, 'notification-dot bg-danger rounded50'])} {...rest} />;
};

export default NotificationDot;
