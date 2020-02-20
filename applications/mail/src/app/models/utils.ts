export type MailSettings = { [key: string]: any };

export interface Cache<Key, Value> {
    has: (key: Key) => boolean;
    get: (key: Key) => Value;
    set: (key: Key, value: Value) => void;
    delete: (key: Key) => void;
    subscribe: (handler: (key: Key) => void) => () => void;
    reset: () => void;
}
