import createReducer from '../utils/createReducer';
import { CREATE_PROMISE, RESOLVE_PROMISE, REJECT_PROMISE, RESET_PROMISES } from './actionTypes';

const createPromise = ({ id, ...rest }) => ({
    id,
    ...rest
});

const filterOutId = (arr, removeId) => {
    return arr.filter(({ id }) => id !== removeId);
};

export default createReducer([], {
    [CREATE_PROMISE]: (state, payload) => {
        const pendingPromise = createPromise(payload);
        return [pendingPromise, ...filterOutId(state, pendingPromise.id)];
    },
    [RESOLVE_PROMISE]: (state, payload) => {
        return filterOutId(state, payload.id);
    },
    [REJECT_PROMISE]: (state, payload) => {
        return filterOutId(state, payload.id);
    },
    [RESET_PROMISES]: () => {
        return [];
    }
});
