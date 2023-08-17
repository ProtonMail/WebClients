export type StorageData = Record<string, any>;

export interface Storage<Store extends StorageData = StorageData> {
    getItems: <T extends StorageData = Store, K extends keyof T = keyof T>(keys: K[]) => Promise<Partial<T>>;
    setItems: <T extends StorageData = Store>(items: Partial<T>) => Promise<void>;
    getItem: <T extends StorageData = Store, K extends keyof T = keyof T>(key: K) => Promise<T[K] | null>;
    setItem: <T extends StorageData = Store, K extends keyof T = keyof T>(key: K, value: T[K]) => Promise<void>;
    removeItems: <T extends StorageData = Store, K extends keyof T = keyof T>(keys: K[]) => Promise<void>;
    removeItem: <T extends StorageData = Store, K extends keyof T = keyof T>(key: K) => Promise<void>;
    clear: () => Promise<void>;
}
