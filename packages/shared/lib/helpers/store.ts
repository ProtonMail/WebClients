export default (initialState: { [key: string]: any } = {}) => {
    let state = initialState;
    let onChange: (() => void) | undefined;

    const set = (key: string, data: any) => {
        state[key] = data;
        onChange?.();
    };

    const get = (key: string) => state[key];

    const remove = (key: string) => delete state[key];

    const reset = () => {
        state = {};
    };

    return {
        onChange: (_onChange: typeof onChange) => {
            onChange = _onChange;
        },
        set,
        get,
        remove,
        reset,
        getState: () => state,
    };
};
