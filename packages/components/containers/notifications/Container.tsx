import { Key, useLayoutEffect, useRef, useState } from 'react';

import Notification from './Notification';
import { NotificationOptions } from './interfaces';

interface Props {
    notifications: NotificationOptions[];
    removeNotification: (id: number) => void;
    hideNotification: (id: number) => void;
}

interface Position {
    top: number;
}

const NotificationsContainer = ({ notifications, removeNotification, hideNotification }: Props) => {
    const containerRef = useRef<HTMLDivElement>(null);
    const notificationRefs = useRef<{ [key: Key]: HTMLDivElement }>({});
    const [positions, setPositions] = useState<{ [key: Key]: Position }>({});

    useLayoutEffect(() => {
        const rects = Object.entries(notificationRefs.current).reduce<{ [key: Key]: DOMRect }>((acc, [key, el]) => {
            if (!el) {
                return acc;
            }
            acc[key] = el.getBoundingClientRect();
            return acc;
        }, {});
        let top = 0;
        const gap = 4;
        setPositions(
            notifications.reduce<{ [key: Key]: Position }>((acc, notification) => {
                acc[notification.key] = { top };
                top += rects[notification.key].height + gap;
                return acc;
            }, {})
        );
    }, [notifications]);

    const list = notifications.map(({ id, key, type, text, isClosing, disableAutoClose, showCloseButton, icon }) => {
        return (
            <Notification
                key={key}
                top={positions[key]?.top}
                ref={(el: HTMLDivElement | null) => {
                    if (el === null) {
                        delete notificationRefs.current[key];
                        return;
                    }
                    notificationRefs.current[key] = el;
                }}
                isClosing={isClosing}
                showCloseButton={showCloseButton}
                icon={icon}
                type={type}
                onClick={disableAutoClose ? undefined : () => hideNotification(id)}
                onExit={() => removeNotification(id)}
            >
                {text}
            </Notification>
        );
    });

    return (
        <div ref={containerRef} className="notifications-container flex flex-column flex-align-items-center no-print">
            {list}
        </div>
    );
};

export default NotificationsContainer;
