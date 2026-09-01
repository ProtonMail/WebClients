import type { AnimationEvent, MouseEvent, ReactNode, Ref } from 'react';
import { cloneElement, forwardRef, isValidElement } from 'react';

import type { CustomNotificationProps, NotificationType } from '@proton/app-context/notifications/interfaces';
import type { IconComponent } from '@proton/icons/component';
import clsx from '@proton/utils/clsx';

import { NotificationCloseButton } from './NotificationButton';
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
    icon?: IconComponent;
    top: number | undefined;
    dataTestId?: string;
}

const NotificationBase = (
    {
        children,
        type,
        top,
        isClosing,
        isDuplicate,
        onClick,
        showCloseButton,
        onClose,
        onExit,
        onEnter,
        icon: Icon,
        dataTestId,
    }: Props,
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
                !!Icon && 'notification--has-icon',
                onClose && 'notification--has-close-button',
            ])}
            onClick={onClick}
            onAnimationEnd={handleAnimationEnd}
            style={{
                '--top-custom': top === undefined ? '-999px' : `${top}px`,
            }}
            data-testid={dataTestId ? `notification:${dataTestId}` : undefined}
        >
            <NotificationContext.Provider value={{ type }}>
                {Icon && <Icon className="notification__icon" />}
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
