export type Listener<Arguments extends any[], Return> = (...args: Arguments) => Return;

export interface Listeners<Arguments extends any[], Return> {
    notify: (...args: Arguments) => Return[];
    subscribe: (listener: Listener<Arguments, Return>) => () => void;
    clear: () => void;
    length: () => number;
}

const createListeners = <Arguments extends any[], Return = void>(): Listeners<Arguments, Return> => {
    let listeners: Listener<Arguments, Return>[] = [];

    const notify = (...args: Arguments) => {
        return listeners.map((listener) => {
            return listener(...args);
        });
    };

    const subscribe = (listener: Listener<Arguments, Return>) => {
        listeners.push(listener);
        return () => {
            listeners.splice(listeners.indexOf(listener), 1);
        };
    };

    const clear = () => {
        listeners = [];
    };

    const length = () => listeners.length;

    return {
        notify,
        subscribe,
        clear,
        length,
    };
};

export default createListeners;
