import { AnimationEvent, MouseEvent, ReactNode, Ref, cloneElement, forwardRef, isValidElement } from 'react';

import { Icon, IconName } from '../../components/icon';
import { classnames } from '../../helpers';
import { NotificationCloseButton } from './NotificationButton';
import { CustomNotificationProps, NotificationType } from './interfaces';
import NotificationContext from './notificationContext';

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
    onClose?: () => void;
    showCloseButton?: boolean;
    icon?: IconName;
    top: number | undefined;
}

const NotificationBase = (
    { children, type, top, isClosing, onClick, showCloseButton, onClose, onExit, icon }: Props,
    ref: Ref<HTMLDivElement>
) => {
    const handleAnimationEnd = ({ animationName }: AnimationEvent<HTMLDivElement>) => {
        if (animationName === ANIMATIONS.NOTIFICATION_OUT && isClosing) {
            onExit();
        }
    };

    return (
        <div
            ref={ref}
            aria-atomic="true"
            role="alert"
            className={classnames([
                CLASSES.NOTIFICATION,
                CLASSES.NOTIFICATION_IN,
                TYPES_CLASS[type] || TYPES_CLASS.success,
                isClosing && CLASSES.NOTIFICATION_OUT,
                icon && 'notification--has-icon',
                onClose && 'notification--has-close-button',
            ])}
            onClick={onClick}
            onAnimationEnd={handleAnimationEnd}
            style={{
                '--top-custom': top === undefined ? '-999px' : `${top}px`,
            }}
        >
            <NotificationContext.Provider value={{ type }}>
                {icon && <Icon name={icon} className="notification__icon" />}
                <span className="notification__content">
                    {isValidElement<CustomNotificationProps>(children) ? cloneElement(children, { onClose }) : children}
                </span>
                {showCloseButton && <NotificationCloseButton onClick={onClose} />}
            </NotificationContext.Provider>
        </div>
    );
};

const Notification = forwardRef<HTMLDivElement, Props>(NotificationBase);

export default Notification;
