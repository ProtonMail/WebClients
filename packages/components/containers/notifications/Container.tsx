import type { Key } from 'react';
import { Fragment, useEffect, useRef, useState } from 'react';

import useInstance from '@proton/hooks/useInstance';
import clsx from '@proton/utils/clsx';
import noop from '@proton/utils/noop';

import Notification from './Notification';
import type { NotificationOffset, Notification as NotificationType } from './interfaces';

const notificationGap = 4;

const getRects = (notifications: Map<Key, HTMLDivElement>) => {
    const map = new Map<Key, DOMRect>();

    for (const [key, el] of notifications.entries()) {
        if (!el) {
            continue;
        }
        map.set(key, el.getBoundingClientRect());
    }

    return map;
};

type Position = number;

const getPositions = (notifications: NotificationType[], rects: ReturnType<typeof getRects>) => {
    let top = 0;

    const map = new Map<Key, Position>();

    notifications.forEach((notification) => {
        map.set(notification.key, top);

        const height = rects.get(notification.key)?.height;
        if (height === undefined) {
            return;
        }
        top += height + notificationGap;
    });

    return map;
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
    const notificationRefs = useInstance(() => {
        return new Map<Key, HTMLDivElement>();
    });

    const [rects, setRects] = useState(() => {
        return new Map<Key, DOMRect>();
    });

    const resizeObserverRef = useRef<ResizeObserver | null>(null);
    const callbackRefs = useInstance(() => {
        return new Map<Key, (el: HTMLDivElement | null) => void>();
    });

    useEffect(() => {
        const observer = new ResizeObserver(() => {
            setRects(getRects(notificationRefs));
        });
        resizeObserverRef.current = observer;
        for (const el of notificationRefs.values()) {
            observer.observe(el);
        }
        return () => {
            observer.disconnect();
            resizeObserverRef.current = null;
        };
    }, [notificationRefs]);

    useEffect(() => {
        const notificationIds = new Set(notifications.map((notification) => notification.key));
        for (const callbackKey of callbackRefs.keys()) {
            if (!notificationIds.has(callbackKey)) {
                callbackRefs.delete(callbackKey);
            }
        }
    }, [notifications, callbackRefs]);

    const positions = getPositions(notifications, rects);

    const list = notifications.map(
        ({ id, key, type, text, isClosing, showCloseButton, icon, duplicate, dataTestId }) => {
            if (!callbackRefs.has(key)) {
                callbackRefs.set(key, (el: HTMLDivElement | null) => {
                    if (el === null) {
                        const oldEl = notificationRefs.get(key);
                        if (oldEl) {
                            resizeObserverRef.current?.unobserve(oldEl);
                        }
                        notificationRefs.delete(key);
                    } else {
                        resizeObserverRef.current?.observe(el);
                        notificationRefs.set(key, el);
                    }
                });
            }

            return (
                <Fragment key={key}>
                    {duplicate.old && (
                        <Notification
                            top={positions.get(key)}
                            isClosing={true}
                            isDuplicate={true}
                            icon={duplicate.old.icon}
                            type={duplicate.old.type}
                            onClose={noop}
                            onEnter={noop}
                            onExit={noop}
                            showCloseButton={duplicate.old.showCloseButton}
                            dataTestId={duplicate.old.dataTestId}
                        >
                            {text}
                        </Notification>
                    )}
                    <Notification
                        key={duplicate.key}
                        onEnter={() => removeDuplicate(id)}
                        top={positions.get(key)}
                        ref={callbackRefs.get(key)}
                        isClosing={isClosing}
                        icon={icon}
                        type={type}
                        onClose={() => hideNotification(id)}
                        onExit={() => removeNotification(id)}
                        showCloseButton={showCloseButton}
                        dataTestId={dataTestId}
                    >
                        {text}
                    </Notification>
                </Fragment>
            );
        }
    );

    return (
        <div
            ref={containerRef}
            className={clsx(
                'notifications-container flex flex-column items-center no-print',
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
