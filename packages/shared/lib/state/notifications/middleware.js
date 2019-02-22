import { ADD_NOTIFICATION, CLEAR_NOTIFICATIONS, REMOVE_NOTIFICATION } from './actionTypes';

export default (store) => {
    let idx = 0;
    let intervalIds = {};

    const addNotification = ({ id = idx++, expiration = 2500, ...rest }) => {
        if (idx >= 1000) {
            idx = 0;
        }

        const clear = () => store.dispatch({
            type: REMOVE_NOTIFICATION,
            payload: id
        });

        intervalIds[id] = setTimeout(clear, expiration);
        return { id, ...rest };
    };

    const removeNotification = (id) => {
        const intervalId = intervalIds[id];
        if (!intervalId) {
            return;
        }

        clearTimeout(intervalId);
        delete intervalIds[id];
    };

    const clearNotifications = () => {
        Object.keys((intervalIds)).forEach((id) => {
            const intervalId = intervalIds[id];
            clearTimeout(intervalId);
        });
        intervalIds = {};
    };

    return (next) => (action) => {
        if (!action.type) {
            return next(action);
        }

        const type = action.type;

        if (type === ADD_NOTIFICATION) {
            return next({
                type: ADD_NOTIFICATION,
                payload: addNotification(action.payload)
            });
        }

        if (type === REMOVE_NOTIFICATION) {
            removeNotification(action.payload);
            return next(action);
        }

        if (type === CLEAR_NOTIFICATIONS) {
            clearNotifications();
            return next(action);
        }

        return next(action);
    }
}
