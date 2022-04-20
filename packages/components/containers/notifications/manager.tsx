import { Dispatch, SetStateAction } from 'react';
import DOMPurify from 'dompurify';
import { isElement } from '@proton/shared/lib/helpers/dom';
import { NotificationOptions, CreateNotificationOptions } from './interfaces';

function createNotificationManager(setNotifications: Dispatch<SetStateAction<NotificationOptions[]>>) {
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
        expiration = 3500,
        type = 'success',
        text,
        disableAutoClose,
        deduplicate = type === 'error',
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
            const sanitizedElement = DOMPurify.sanitize(text, { RETURN_DOM: true });
            const containsHTML =
                sanitizedElement?.childNodes && Array.from(sanitizedElement.childNodes).some(isElement);
            if (containsHTML) {
                sanitizedElement.querySelectorAll('A').forEach((node) => {
                    if (node.tagName === 'A') {
                        node.setAttribute('rel', 'noopener noreferrer');
                        node.setAttribute('target', '_blank');
                    }
                });
                expiration = Math.max(5000, expiration);
                disableAutoClose = true;
                text = <div dangerouslySetInnerHTML={{ __html: sanitizedElement.innerHTML }} />;
            }
        }

        setNotifications((oldNotifications) => {
            const newNotification: NotificationOptions = {
                id,
                key,
                type,
                text,
                disableAutoClose,
                ...rest,
                isClosing: false,
            };

            if (deduplicate) {
                const duplicateOldNotification = oldNotifications.find(
                    (oldNotification) => oldNotification.key === key
                );
                if (duplicateOldNotification) {
                    removeInterval(duplicateOldNotification.id);
                    return oldNotifications.map((oldNotification) => {
                        if (oldNotification === duplicateOldNotification) {
                            return {
                                ...newNotification,
                                key: duplicateOldNotification.key,
                            };
                        }
                        return oldNotification;
                    });
                }
            }
            return [...oldNotifications, newNotification];
        });

        intervalIds.set(id, expiration === -1 ? -1 : setTimeout(() => hideNotification(id), expiration));

        return id;
    };

    const clearNotifications = () => {
        intervalIds.forEach((intervalId) => {
            clearTimeout(intervalId);
        });

        intervalIds.clear();

        return setNotifications([]);
    };

    return {
        createNotification,
        removeNotification,
        hideNotification,
        clearNotifications,
    };
}

export type NotificationsManager = ReturnType<typeof createNotificationManager>;

export default createNotificationManager;
