import type { Dispatch, SetStateAction } from 'react';

import DOMPurify from 'dompurify';

import { isElement } from '@proton/shared/lib/helpers/dom';

import { NOTIFICATION_DEFAULT_EXPIRATION_TIME } from './constants';
import type { CreateNotificationOptions, Notification, NotificationOffset } from './interfaces';

function createNotificationManager(
    setNotifications: Dispatch<SetStateAction<Notification[]>>,
    setNotificationOffset: Dispatch<NotificationOffset | undefined>
) {
    let idx = 1;
    const intervalIds = new Map<number, any>();

    const removeInterval = (id: number) => {
        const intervalId = intervalIds.get(id);
        if (!intervalId) {
            return;
        }
        if (intervalId !== -1) {
            clearTimeout(intervalId);
        }
        intervalIds.delete(id);
    };

    const removeNotification = (id: number) => {
        const intervalId = intervalIds.get(id);
        if (!intervalId) {
            return;
        }
        removeInterval(id);
        return setNotifications((oldNotifications) => {
            return oldNotifications.filter(({ id: otherId }) => id !== otherId);
        });
    };

    const hideNotification = (id: number) => {
        // If the page is hidden, don't hide the notification with an animation because they get stacked.
        // This is to solve e.g. offline notifications appearing when the page is hidden, and when you focus
        // the tab again, they would be visible for the animation out even if they happened a while ago.
        if (document.hidden) {
            return removeNotification(id);
        }
        return setNotifications((oldNotifications) => {
            return oldNotifications.map((oldNotification) => {
                if (oldNotification.id !== id) {
                    return oldNotification;
                }
                return {
                    ...oldNotification,
                    isClosing: true,
                };
            });
        });
    };

    const createNotification = ({
        id = idx++,
        key,
        expiration = NOTIFICATION_DEFAULT_EXPIRATION_TIME,
        type = 'success',
        text,
        showCloseButton = true,
        icon = type === 'warning' || type === 'error' ? 'exclamation-triangle-filled' : undefined,
        deduplicate = true,
        ...rest
    }: CreateNotificationOptions) => {
        if (intervalIds.has(id)) {
            throw new Error('notification already exists');
        }

        if (idx >= 1000) {
            idx = 0;
        }

        if (key === undefined) {
            key = typeof text === 'string' && deduplicate ? text : id;
        }

        if (typeof text === 'string') {
            const sanitizedElement = DOMPurify.sanitize(text, {
                RETURN_DOM: true,
                ALLOWED_TAGS: ['b', 'a', 'i', 'em', 'strong', 'br', 'p', 'span'],
            });
            const containsHTML =
                sanitizedElement?.childNodes && Array.from(sanitizedElement.childNodes).some(isElement);
            if (containsHTML) {
                sanitizedElement.querySelectorAll('a').forEach((node) => {
                    if (node.tagName === 'A') {
                        node.setAttribute('rel', 'noopener noreferrer');
                        node.setAttribute('target', '_blank');
                        node.setAttribute('class', 'color-inherit');
                    }
                });
                expiration = Math.max(NOTIFICATION_DEFAULT_EXPIRATION_TIME, expiration);
                text = <div dangerouslySetInnerHTML={{ __html: sanitizedElement.innerHTML }} />;
            }
        }

        setNotifications((oldNotifications) => {
            const newNotification: Notification = {
                id,
                key: key!,
                type,
                text,
                ...rest,
                isClosing: false,
                showCloseButton,
                icon,
                duplicate: {
                    key: 1,
                    state: 'init',
                    old: undefined,
                },
            };

            if (deduplicate) {
                const duplicateOldNotification = oldNotifications.find(
                    (oldNotification) => oldNotification.key === key
                );
                if (duplicateOldNotification) {
                    removeInterval(duplicateOldNotification.id);
                    return oldNotifications.map((oldNotification) => {
                        if (oldNotification === duplicateOldNotification) {
                            const hasOldDuplicate =
                                !!oldNotification.duplicate.old || oldNotification.duplicate.state === 'init';
                            return {
                                ...newNotification,
                                duplicate: {
                                    old: hasOldDuplicate ? oldNotification.duplicate.old : oldNotification,
                                    state: oldNotification.duplicate.state,
                                    key: hasOldDuplicate
                                        ? oldNotification.duplicate.key
                                        : oldNotification.duplicate.key + 1,
                                },
                                key: duplicateOldNotification.key,
                            };
                        }
                        return oldNotification;
                    });
                }
            }
            return [newNotification, ...oldNotifications];
        });

        intervalIds.set(id, expiration === -1 ? -1 : setTimeout(() => hideNotification(id), expiration));

        return id;
    };

    const removeDuplicate = (id: number) => {
        return setNotifications((oldNotifications) => {
            return oldNotifications.map((oldNotification) => {
                if (oldNotification.id !== id) {
                    return oldNotification;
                }
                return {
                    ...oldNotification,
                    duplicate: {
                        old: undefined,
                        state: 'removed',
                        key: oldNotification.duplicate.key,
                    },
                };
            });
        });
    };

    const clearNotifications = () => {
        intervalIds.forEach((intervalId) => {
            clearTimeout(intervalId);
        });

        intervalIds.clear();

        return setNotifications([]);
    };

    return {
        setOffset: setNotificationOffset,
        removeDuplicate,
        createNotification,
        removeNotification,
        hideNotification,
        clearNotifications,
    };
}

export type NotificationsManager = ReturnType<typeof createNotificationManager>;

export default createNotificationManager;
