export default (state = {}) => {
    const set = (key, data) => state[key] = data;
    const get = (key) => state[key];
    const remove = (key) => delete state[key];
    const reset = () => state = {};

    return {
        set,
        get,
        remove,
        reset,
        getState: () => state
    }
};
