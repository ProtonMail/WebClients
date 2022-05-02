import { AnimationEvent, MouseEvent, ReactNode } from 'react';
import { classnames } from '../../helpers';
import { NotificationType } from './interfaces';

const TYPES_CLASS = {
    error: 'bg-danger',
    warning: 'bg-warning',
    info: 'bg-info',
    success: 'bg-success',
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
    onClick?: (e: MouseEvent<HTMLDivElement>) => void;
}

const Notification = ({ children, type, isClosing, onClick, onExit }: Props) => {
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
                'p1',
                'mb0-5',
                'text-break',
                CLASSES.NOTIFICATION,
                CLASSES.NOTIFICATION_IN,
                TYPES_CLASS[type] || TYPES_CLASS.success,
                isClosing && CLASSES.NOTIFICATION_OUT,
            ])}
            onClick={onClick}
            onAnimationEnd={handleAnimationEnd}
        >
            {children}
        </div>
    );
};

export default Notification;
