export interface Cache<Key, Value> {
    has: (key: Key) => boolean;
    get: (key: Key) => Value | undefined;
    set: (key: Key, value: Value) => void;
    delete: (key: Key) => void;
    subscribe: (handler: (key: Key) => void) => () => void;
    reset: () => void;
}
