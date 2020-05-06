type Listener<A extends any[], R> = (...args: A) => Promise<R>;

const createListeners = <A extends any[], R>() => {
    let listeners: Listener<A, R>[] = [];

    const notify = (...args: A) => {
        return listeners.map((listener) => {
            return listener(...args);
        });
    };

    const subscribe = (listener: Listener<A, R>) => {
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
