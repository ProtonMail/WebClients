export const CREATE_PROMISE = 'CREATE_PROMISE';
export const RESOLVE_PROMISE = 'RESOLVE_PROMISE';
export const REJECT_PROMISE = 'REJECT_PROMISE';
export const RESET_PROMISES = 'RESET_PROMISES';

export const createAction = (payload) => {
    return {
        type: CREATE_PROMISE,
        payload
    };
};

export const resolveAction = (id) => {
    return {
        type: RESOLVE_PROMISE,
        payload: id
    };
};
export const rejectAction = (id) => {
    return {
        type: REJECT_PROMISE,
        payload: id
    };
};

export const resetAction = () => {
    return {
        type: RESET_PROMISES
    };
};
