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

        intervalIds[id] = expiration === -1 ? -1 : setTimeout(() => hideNotification(id), expiration);

        return setNotifications((oldNotifications) => {
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
