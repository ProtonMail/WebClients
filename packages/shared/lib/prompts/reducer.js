import { CREATE_PROMISE, RESOLVE_PROMISE, REJECT_PROMISE, RESET_PROMISES } from './actions';

const createPromise = ({ id, ...rest }) => ({
    id,
    ...rest
});

const filterOutId = (arr, removeId) => {
    return arr.filter(({ id }) => id !== removeId);
};

export default (state, { type, payload }) => {
    if (type === CREATE_PROMISE) {
        const pendingPromise = createPromise(payload);
        return [...state, pendingPromise];
    }

    if (type === RESOLVE_PROMISE || type === REJECT_PROMISE) {
        return filterOutId(state, payload);
    }

    if (type === RESET_PROMISES) {
        return [];
    }
};
