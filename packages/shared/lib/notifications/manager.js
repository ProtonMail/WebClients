import { clearAction, createAction, removeAction } from './actions';
import reducer from './reducer';
import createListeners from '../helpers/listeners';

const createNotifications = () => {
    let idx = 0;
    let intervalIds = {};
    let state = [];
    const listeners = createListeners();

    const get = () => state;

    const dispatch = (action) => {
        state = reducer(state, action);
        listeners.notify(state);
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
        subscribe: listeners.subscribe
    };
};

export default createNotifications;
