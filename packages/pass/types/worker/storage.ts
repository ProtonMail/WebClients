import type { MaybeNull, MaybePromise } from '@proton/pass/types';

export type StorageQuery<T, K extends (keyof T)[]> = Partial<Pick<T, K[number]>>;
export type StorageData = Record<string, any>;

export type GetItem<T = StorageData> = <K extends keyof T>(key: K) => Promise<MaybeNull<T[K]>>;
export type GetItems<T = StorageData, K extends (keyof T)[] = (keyof T)[]> = (keys: K) => Promise<StorageQuery<T, K>>;
export type SetItem<T = StorageData> = <K extends keyof T>(key: K, value: T[K]) => Promise<void>;
export type SetItems<T = StorageData> = (items: Partial<T>) => Promise<void>;
export type RemoveItem<T = StorageData> = <K extends keyof T>(key: K) => Promise<void>;
export type RemoveItems<T = StorageData> = <K extends (keyof T)[]>(keys: K) => Promise<void>;

export interface Store<T = StorageData, K extends keyof T = keyof T> {
    set: (key: K, value: T[K]) => void;
    get: (key: K) => MaybeNull<T[K]>;
    reset: () => void;
}

export interface Storage<T = StorageData> {
    setItem: <K extends keyof T>(key: K, value: T[K]) => MaybePromise<void>;
    getItem: <K extends keyof T>(key: K) => MaybePromise<MaybeNull<T[K]>>;
    removeItem: <K extends keyof T>(key: K) => MaybePromise<void>;
    clear: () => MaybePromise<void>;
}

export interface ExtensionStorage<T> extends Storage<T> {
    getItems: GetItems<T>;
    setItems: SetItems<T>;
    removeItems: RemoveItems<T>;
}

/** TypeScript's constraint enforcement on interfaces extending generics
 * can be inadequate. `AnyStorage<T>` ensures type safety for the `T`
 * constraint across all subtypes of `ExtensionStorage<T>` or `Storage<T>` */
export type AnyStorage<T> = ExtensionStorage<T> | Storage<T>;

export interface StorageInterface<T = StorageData> {
    getItem: GetItem<T>;
    getItems: GetItems<T>;
    setItem: SetItem<T>;
    setItems: SetItems<T>;
    removeItem: RemoveItem<T>;
    removeItems: RemoveItems<T>;
    clear: () => Promise<void>;
}
