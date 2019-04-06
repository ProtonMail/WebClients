import { createAction, resetAction, rejectAction, resolveAction } from './actions';
import reducer from './reducer';
import createListeners from '../helpers/listeners';
import { createDefer } from '../helpers/promise';

const createPrompts = () => {
    let promiseMap = {};
    let idx = 0;
    let state = [];
    const listeners = createListeners();

    const get = () => state;

    const dispatch = (action) => {
        state = reducer(state, action);
        listeners.notify(state);
    };

    const handle = (rejectOrResolve) => (id, value) => {
        if (!promiseMap[id]) {
            throw new Error('Promise does not exist');
        }

        const { [rejectOrResolve]: fn } = promiseMap[id];
        delete promiseMap[id];

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

        if (promiseMap[id]) {
            throw new Error('Promise already exists');
        }

        const defer = createDefer();
        promiseMap[id] = defer;

        const component = fn((value) => resolvePromise(id, value), (err) => rejectPromise(id, err));

        dispatch(createAction({ id, component }));

        return defer.promise;
    };

    const resetPrompts = () => {
        const error = new Error('reset');
        error.name = 'ResetError';

        Object.keys(promiseMap).forEach((id) => {
            rejectPromise(id, error);
        });

        promiseMap = {};

        dispatch(resetAction());
    };

    return {
        createPrompt,
        resetPrompts,
        get,
        subscribe: listeners.subscribe
    };
};

export default createPrompts;
