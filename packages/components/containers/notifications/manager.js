export default (setNotifications) => {
    let idx = 1;
    let intervalIds = {};

    const removeNotification = (id) => {
        const intervalId = intervalIds[id];
        if (!intervalId) {
            return;
        }

        if (intervalId !== -1) {
            clearTimeout(intervalId);
        }
        delete intervalIds[id];

        return setNotifications((oldNotifications) => {
            return oldNotifications.filter(({ id: otherId }) => id !== otherId);
        });
    };

    const hideNotification = (id) => {
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
                    isClosing: true
                };
            });
        });
    };

    const createNotification = ({ id = idx++, expiration = 3500, type = 'success', ...rest }) => {
        if (intervalIds[id]) {
            throw new Error('notification already exists');
        }
        if (idx >= 1000) {
            idx = 0;
        }

        setNotifications((oldNotifications) => {
            return [
                ...oldNotifications,
                {
                    id,
                    expiration,
                    type,
                    ...rest,
                    isClosing: false
                }
            ];
        });

        intervalIds[id] = expiration === -1 ? -1 : setTimeout(() => hideNotification(id), expiration);

        return id;
    };

    const clearNotifications = () => {
        Object.keys(intervalIds).forEach((id) => {
            const intervalId = intervalIds[id];
            clearTimeout(intervalId);
        });
        intervalIds = {};

        return setNotifications([]);
    };

    return {
        createNotification,
        removeNotification,
        hideNotification,
        clearNotifications
    };
};
