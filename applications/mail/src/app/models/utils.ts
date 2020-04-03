export interface Cache<Value> {
    has: (key: string) => boolean;
    get: (key: string) => Value | undefined;
    set: (key: string, value: Value) => void;
    toObject: () => { [key: string]: Value | undefined };
    delete: (key: string) => void;
    subscribe: (handler: (key: string) => void) => () => void;
    reset: () => void;
}
