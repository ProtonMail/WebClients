import React from 'react';
import PropTypes from 'prop-types';

const TYPES_CLASS = {
    error: 'notification-alert',
    warning: 'notification-warning',
    success: 'notification-success'
};

const CLASSES = {
    NOTIFICATION: 'notification',
    NOTIFICATION_IN: 'notificationIn',
    NOTIFICATION_OUT: 'notificationOut'
};

const Notification = ({ children, type, isClosing, onClick, onExit }) => {
    const className = [
        'p1',
        'mb0-5',
        CLASSES.NOTIFICATION,
        CLASSES.NOTIFICATION_IN,
        TYPES_CLASS[type] || TYPES_CLASS.success,
        isClosing && CLASSES.NOTIFICATION_OUT
    ]
        .filter(Boolean)
        .join(' ');

    const handleAnimationEnd = ({ animationName }) => {
        if (animationName === CLASSES.NOTIFICATION_OUT && isClosing) {
            onExit();
        }
    };

    return (
        <div
            aria-atomic="true"
            role="alert"
            className={className}
            onClick={onClick}
            onAnimationEnd={handleAnimationEnd}
        >
            {children}
        </div>
    );
};

Notification.propTypes = {
    children: PropTypes.node.isRequired,
    type: PropTypes.string.isRequired,
    isClosing: PropTypes.bool.isRequired,
    onExit: PropTypes.func.isRequired,
    onClick: PropTypes.func.isRequired
};

export default Notification;
