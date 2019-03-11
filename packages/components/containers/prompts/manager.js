import { createAction, resetAction, rejectAction, resolveAction } from './actions';

const createDefer = () => {
    const result = {};
    result.promise = new Promise((resolve, reject) => {
        result.resolve = resolve;
        result.reject = reject;
    });
    return result;
};

export default (dispatch) => {
    let state = {};
    let idx = 0;

    const handle = (rejectOrResolve) => (id, value) => {
        if (!state[id]) {
            throw new Error('Promise does not exist');
        }

        const { [rejectOrResolve]: fn } = state[id];
        delete state[id];

        dispatch(rejectOrResolve === 'reject' ? rejectAction(id) : resolveAction(id));

        fn(value);
    };

    const resolvePromise = handle('resolve');
    const rejectPromise = handle('reject');

    const createPrompt = (fn) => {
        const id = idx++;
        if (idx >= 1000) {
            idx = 0;
        }

        if (state[id]) {
            throw new Error('Promise already exists');
        }

        const defer = createDefer();
        state[id] = defer;

        const component = fn((value) => resolvePromise(id, value), (err) => rejectPromise(id, err));

        dispatch(createAction({ id, component }));

        return defer.promise;
    };

    const resetPrompts = () => {
        const error = new Error('reset');
        error.name = 'ResetError';

        Object.keys(state).forEach((id) => {
            rejectPromise(id, error);
        });

        state = {};

        dispatch(resetAction());
    };

    return {
        createPrompt,
        resetPrompts
    };
};
