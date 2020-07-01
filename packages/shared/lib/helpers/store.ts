export default (initialState: { [key: string]: any } = {}) => {
    let state = initialState;

    const set = (key: string, data: any) => {
        state[key] = data;
    };

    const get = (key: string) => state[key];

    const remove = (key: string) => delete state[key];

    const reset = () => {
        state = {};
    };

    return {
        set,
        get,
        remove,
        reset,
        getState: () => state
    };
};
