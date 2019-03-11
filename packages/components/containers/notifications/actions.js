export const ADD_NOTIFICATION = 'ADD_NOTIFICATION';
export const REMOVE_NOTIFICATION = 'REMOVE_NOTIFICATION';
export const CLEAR_NOTIFICATIONS = 'CLEAR_NOTIFICATIONS';

export const createAction = (payload) => {
    return {
        type: ADD_NOTIFICATION,
        payload
    };
};

export const removeAction = (id) => {
    return {
        type: REMOVE_NOTIFICATION,
        payload: id
    };
};

export const clearAction = () => {
    return {
        type: CLEAR_NOTIFICATIONS
    };
};
