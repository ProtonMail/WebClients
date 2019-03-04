const createDefer = () => {
    const result = {};
    result.promise = new Promise((resolve, reject) => {
        result.resolve = resolve;
        result.reject = reject;
    });
    return result;
};

export default () => {
    let state = {};
    let idx = 0;

    const create = (id = idx++) => {
        if (idx >= 1000) {
            idx = 0;
        }
        if (state[id]) {
            throw new Error('Promise already exists');
        }
        state[id] = createDefer();
        return {
            ...state[id],
            id
        };
    };

    const handle = (rejectOrResolve) => (id, value) => {
        if (!state[id]) {
            throw new Error('Promise does not exist');
        }
        const { [rejectOrResolve]: fn } = state[id];
        delete state[id];
        return fn(value);
    };

    const reset = () => {
        Object.keys(state).forEach((id) => {
            state[id].reject(new Error('Reset'));
        });
        state = {};
    };

    return {
        create,
        resolve: handle('resolve'),
        reject: handle('reject'),
        reset
    };
};
