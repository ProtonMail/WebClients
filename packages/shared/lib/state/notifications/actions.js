import { ADD_NOTIFICATION, REMOVE_NOTIFICATION, CLEAR_NOTIFICATIONS } from './actionTypes';

export const create = (payload) => {
    return {
        type: ADD_NOTIFICATION,
        payload
    };
};

export const remove = (id) => {
    return {
        type: REMOVE_NOTIFICATION,
        payload: id
    };
};

export const clear = () => {
    return {
        type: CLEAR_NOTIFICATIONS
    };
};
