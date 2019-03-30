const createStore = (initialState) => {
    let state = initialState;
    let listeners = [];

    const set = (value) => {
        state = value;
        listeners.forEach((listener) => {
            listener(state);
        });
    };

    const get = () => {
        return state;
    };

    const subscribe = (listener) => {
        listeners.push(listener);
        return () => {
            listeners.splice(listeners.indexOf(listener), 1);
        };
    };

    const reset = () => {
        listeners = [];
        state = undefined;
    };

    return {
        set,
        get,
        subscribe,
        reset
    };
};

export default createStore;
