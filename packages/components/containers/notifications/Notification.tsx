import type { AnimationEvent, MouseEvent, ReactNode, Ref } from 'react';
import { cloneElement, forwardRef, isValidElement } from 'react';

import Icon, { type IconName } from '@proton/components/components/icon/Icon';
import clsx from '@proton/utils/clsx';

import { NotificationCloseButton } from './NotificationButton';
import type { CustomNotificationProps, NotificationType } from './interfaces';
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
    NOTIFICATION_OUT_DUPLICATE: 'notification--out-duplicate',
};

const ANIMATIONS = {
    NOTIFICATION_IN: 'anime-notification-in',
    NOTIFICATION_OUT: 'anime-notification-out',
};

interface Props {
    children: ReactNode;
    type: NotificationType;
    isClosing: boolean;
    isDuplicate?: boolean;
    onExit: () => void;
    onClick?: (e: MouseEvent<HTMLElement>) => void;
    onClose?: () => void;
    onEnter: () => void;
    showCloseButton?: boolean;
    icon?: IconName;
    top: number | undefined;
}

const NotificationBase = (
    { children, type, top, isClosing, isDuplicate, onClick, showCloseButton, onClose, onExit, onEnter, icon }: Props,
    ref: Ref<HTMLDivElement>
) => {
    const handleAnimationEnd = ({ animationName }: AnimationEvent<HTMLDivElement>) => {
        if (animationName === ANIMATIONS.NOTIFICATION_IN) {
            onEnter();
        }
        if (animationName === ANIMATIONS.NOTIFICATION_OUT && isClosing) {
            onExit();
        }
    };

    return (
        <div
            ref={ref}
            aria-atomic="true"
            role="alert"
            className={clsx([
                CLASSES.NOTIFICATION,
                CLASSES.NOTIFICATION_IN,
                TYPES_CLASS[type] || TYPES_CLASS.success,
                isClosing && (isDuplicate ? CLASSES.NOTIFICATION_OUT_DUPLICATE : CLASSES.NOTIFICATION_OUT),
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
