import React, { Fragment, Key, useEffect, useRef, useState } from 'react';

import clsx from '@proton/utils/clsx';
import noop from '@proton/utils/noop';

import Notification from './Notification';
import { NotificationOffset, Notification as NotificationType } from './interfaces';

const notificationGap = 4;

const getRects = (notifications: { [key: Key]: HTMLDivElement }) => {
    return Object.entries(notifications).reduce<{ [key: Key]: DOMRect }>((acc, [key, el]) => {
        if (!el) {
            return acc;
        }
        acc[key] = el.getBoundingClientRect();
        return acc;
    }, {});
};

type Position = number;

const getPositions = (notifications: NotificationType[], rects: ReturnType<typeof getRects>) => {
    let top = 0;

    return notifications.reduce<{ [key: Key]: Position }>((acc, notification) => {
        acc[notification.key] = top;

        const height = rects[notification.key]?.height;
        if (height === undefined) {
            return acc;
        }
        top += height + notificationGap;

        return acc;
    }, {});
};

interface Props {
    notifications: NotificationType[];
    removeNotification: (id: number) => void;
    hideNotification: (id: number) => void;
    removeDuplicate: (id: number) => void;
    offset?: NotificationOffset;
}

const NotificationsContainer = ({
    notifications,
    removeNotification,
    hideNotification,
    removeDuplicate,
    offset,
}: Props) => {
    const containerRef = useRef<HTMLDivElement>(null);
    const notificationRefs = useRef<{ [key: Key]: HTMLDivElement }>({});
    const [rects, setRects] = useState<{ [key: Key]: DOMRect }>({});
    const resizeObserverRef = useRef<ResizeObserver | null>(null);
    const callbackRefs = useRef<{ [key: Key]: (el: HTMLDivElement | null) => void }>({});

    useEffect(() => {
        const observer = new ResizeObserver(() => {
            setRects(getRects(notificationRefs.current));
        });
        resizeObserverRef.current = observer;
        Object.values(notificationRefs.current).forEach((el) => {
            observer.observe(el);
        });
        return () => {
            observer.disconnect();
            resizeObserverRef.current = null;
        };
    }, []);

    useEffect(() => {
        const notificationIds = Object.fromEntries(notifications.map((notification) => [notification.key, true]));
        const callbackKeys = Object.keys(callbackRefs.current);
        callbackKeys.forEach((callbackKey) => {
            if (!notificationIds[callbackKey]) {
                delete callbackRefs.current[callbackKey];
            }
        });
    }, [notifications]);

    const positions = getPositions(notifications, rects);

    const list = notifications.map(({ id, key, type, text, isClosing, showCloseButton, icon, duplicate }) => {
        if (!callbackRefs.current[key]) {
            callbackRefs.current[key] = (el: HTMLDivElement | null) => {
                if (el === null) {
                    const oldEl = notificationRefs.current[key];
                    if (oldEl) {
                        resizeObserverRef.current?.unobserve(oldEl);
                    }
                    delete notificationRefs.current[key];
                } else {
                    resizeObserverRef.current?.observe(el);
                    notificationRefs.current[key] = el;
                }
            };
        }
        return (
            <Fragment key={key}>
                {duplicate.old && (
                    <Notification
                        top={positions[key]}
                        isClosing={true}
                        isDuplicate={true}
                        icon={duplicate.old.icon}
                        type={duplicate.old.type}
                        onClose={noop}
                        onEnter={noop}
                        onExit={noop}
                        showCloseButton={duplicate.old.showCloseButton}
                    >
                        {text}
                    </Notification>
                )}
                <Notification
                    key={duplicate.key}
                    onEnter={() => removeDuplicate(id)}
                    top={positions[key]}
                    ref={callbackRefs.current[key]}
                    isClosing={isClosing}
                    icon={icon}
                    type={type}
                    onClose={() => hideNotification(id)}
                    onExit={() => removeNotification(id)}
                    showCloseButton={showCloseButton}
                >
                    {text}
                </Notification>
            </Fragment>
        );
    });

    return (
        <div
            ref={containerRef}
            className={clsx(
                'notifications-container flex flex-column flex-align-items-center no-print',
                offset?.y || offset?.x || 0 > 0 ? 'notifications-container--shifted' : undefined
            )}
            style={{
                ...(offset?.y && { '--shift-custom-y': `${offset.y}px` }),
                ...(offset?.x && { '--shift-custom-x': `${offset.x}px` }),
            }}
        >
            {list}
        </div>
    );
};

export default NotificationsContainer;
