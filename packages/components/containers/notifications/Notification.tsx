import { AnimationEvent, MouseEvent, ReactNode } from 'react';

import { Button } from '@proton/atoms';
import { Icon, IconName } from '@proton/components/components';

import { classnames } from '../../helpers';
import { NotificationType } from './interfaces';

const TYPES_CLASS = {
    error: 'notification--error',
    warning: 'notification--warning',
    info: 'notification--info',
    success: 'notification--success',
};

const CLASSES = {
    NOTIFICATION: 'notification',
    NOTIFICATION_IN: 'notification--in',
    NOTIFICATION_OUT: 'notification--out',
};

const ANIMATIONS = {
    NOTIFICATION_IN: 'anime-notification-in',
    NOTIFICATION_OUT: 'anime-notification-out',
};

interface Props {
    children: ReactNode;
    type: NotificationType;
    isClosing: boolean;
    onExit: () => void;
    onClick?: (e: MouseEvent<HTMLElement>) => void;
    showCloseButton?: boolean;
    icon?: IconName;
}

const Notification = ({ children, type, isClosing, onClick, onExit, showCloseButton, icon }: Props) => {
    const handleAnimationEnd = ({ animationName }: AnimationEvent<HTMLDivElement>) => {
        if (animationName === ANIMATIONS.NOTIFICATION_OUT && isClosing) {
            onExit();
        }
    };

    return (
        <div
            aria-atomic="true"
            role="alert"
            className={classnames([
                'text-break',
                CLASSES.NOTIFICATION,
                CLASSES.NOTIFICATION_IN,
                TYPES_CLASS[type] || TYPES_CLASS.success,
                isClosing && CLASSES.NOTIFICATION_OUT,
            ])}
            onAnimationEnd={handleAnimationEnd}
        >
            {icon && <Icon name={icon} className="notification__icon" />}
            <span className="notification__text">{children}</span>
            {showCloseButton && (
                <span className="notification__action">
                    {/* Placeholder */}
                    {/* <Button shape={type == 'info' || type == 'success' ? 'ghost' : 'solid'} color={type == 'info' || type == 'success' ? 'weak' : 'danger'} size="small" onClick={onClick} className="text-bold">Edit</Button> */}
                    <Button
                        shape={type == 'info' || type == 'success' ? 'ghost' : 'solid'}
                        color={type == 'info' || type == 'success' ? 'weak' : 'danger'}
                        size="small"
                        icon
                        onClick={onClick}
                    >
                        <Icon name="cross" />
                    </Button>
                </span>
            )}
        </div>
    );
};

export default Notification;
