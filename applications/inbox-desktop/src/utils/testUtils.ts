export interface Singleton<T> {
    INSTANCE: T;
}

export function getSingleton<T extends Record<string, unknown>>(getInstance: () => T) {
    return class SingletonImpl {
        static INSTANCE: T;

        constructor() {
            if (SingletonImpl.INSTANCE) {
                return SingletonImpl.INSTANCE;
            }

            SingletonImpl.INSTANCE = getInstance();
            return SingletonImpl.INSTANCE;
        }
    };
}
