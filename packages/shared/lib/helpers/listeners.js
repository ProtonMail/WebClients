const createListeners = () => {
    let listeners = [];

    const notify = (...args) => {
        return listeners.map((listener) => {
            return listener(...args);
        });
    };

    const subscribe = (listener) => {
        listeners.push(listener);
        return () => {
            listeners.splice(listeners.indexOf(listener), 1);
        };
    };

    const clear = () => {
        listeners = [];
    };

    return {
        notify,
        subscribe,
        clear
    };
};

export default createListeners;
