import { ADD_NOTIFICATION, REMOVE_NOTIFICATION, CLEAR_NOTIFICATIONS } from './actionTypes';

export const createNotification = (payload) => {
    return {
        type: ADD_NOTIFICATION,
        payload
    };
};

export const removeNotification = (id) => {
    return {
        type: REMOVE_NOTIFICATION,
        payload: id
    };
};

export const clearNotifications = () => {
    return {
        type: CLEAR_NOTIFICATIONS
    };
};
