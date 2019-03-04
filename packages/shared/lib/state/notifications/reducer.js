import createReducer from '../utils/createReducer';
import { ADD_NOTIFICATION, REMOVE_NOTIFICATION, CLEAR_NOTIFICATIONS } from './actionTypes';

const createNotification = ({ id, text, type = 'info' }) => ({
    id,
    text,
    type
});

const filterOutId = (arr, removeId) => {
    return arr.filter(({ id }) => id !== removeId);
};

export default createReducer([], {
    [ADD_NOTIFICATION]: (state, payload) => {
        const notification = createNotification(payload);
        return [notification, ...filterOutId(state, notification.id)];
    },
    [REMOVE_NOTIFICATION]: (state, payload) => {
        return filterOutId(state, payload);
    },
    [CLEAR_NOTIFICATIONS]: () => {
        return [];
    }
});
