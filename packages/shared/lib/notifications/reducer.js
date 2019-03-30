import { ADD_NOTIFICATION, REMOVE_NOTIFICATION, CLEAR_NOTIFICATIONS } from './actions';

const createNotification = ({ id, text, type = 'success' }) => ({
    id,
    text,
    type
});

const filterOutId = (arr, removeId) => {
    return arr.filter(({ id }) => id !== removeId);
};

export default (state, action) => {
    if (action.type === ADD_NOTIFICATION) {
        const notification = createNotification(action.payload);
        return [notification, ...filterOutId(state, notification.id)];
    }

    if (action.type === REMOVE_NOTIFICATION) {
        return filterOutId(state, action.payload);
    }

    if (action.type === CLEAR_NOTIFICATIONS) {
        return [];
    }
};
