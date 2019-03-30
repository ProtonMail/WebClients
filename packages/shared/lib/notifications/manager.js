import { clearAction, createAction, removeAction } from './actions';
import reducer from './reducer';

const createNotifications = ({ get, set, subscribe }) => {
    let idx = 0;
    let intervalIds = {};

    const dispatch = (action) => {
        set(reducer(get(), action));
    };

    const removeNotification = (id) => {
        const intervalId = intervalIds[id];
        if (!intervalId) {
            return;
        }
        clearTimeout(intervalId);
        delete intervalIds[id];
        return dispatch(removeAction(id));
    };

    const createNotification = ({ id = idx++, expiration = 3500, ...rest }) => {
        if (intervalIds[id]) {
            throw new Error('notification already exists');
        }
        if (idx >= 1000) {
            idx = 0;
        }

        const clear = () => removeNotification(id);
        intervalIds[id] = setTimeout(clear, expiration);

        return dispatch(createAction({ id, ...rest }));
    };

    const clearNotifications = () => {
        Object.keys(intervalIds).forEach((id) => {
            const intervalId = intervalIds[id];
            clearTimeout(intervalId);
        });
        intervalIds = {};
        return dispatch(clearAction());
    };

    return {
        createNotification,
        removeNotification,
        clearNotifications,
        get,
        subscribe
    };
};

export default createNotifications;
