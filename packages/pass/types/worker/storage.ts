import type { MaybeNull, MaybePromise } from '@proton/pass/types';

export interface Store<T = any, K extends StorageKeys<T> = StorageKeys<T>> {
    set: (key: K, value: T[K]) => void;
    get: (key: K) => MaybeNull<T[K]>;
    reset: () => void;
}

export interface Storage<T = any, K extends StorageKeys<T> = StorageKeys<T>> {
    setItem: (key: K, value: T[K]) => MaybePromise<void>;
    getItem: (key: K) => MaybePromise<MaybeNull<T[K]>>;
    clear: () => MaybePromise<void>;
}

export type StorageKeys<T> = Extract<keyof T, string>;
export type StorageQuery<T, K extends StorageKeys<T>[]> = Partial<Pick<T, K[number]>>;

export type GetItem<T = any, K extends StorageKeys<T> = StorageKeys<T>> = (key: K) => Promise<MaybeNull<T[K]>>;
export type GetItems<T = any, K extends StorageKeys<T>[] = StorageKeys<T>[]> = (keys: K) => Promise<StorageQuery<T, K>>;
export type SetItem<T = any, K extends StorageKeys<T> = StorageKeys<T>> = (key: K, value: T[K]) => Promise<void>;
export type SetItems<T = any> = (items: Partial<T>) => Promise<void>;
export type RemoveItem<T = any, K extends StorageKeys<T> = StorageKeys<T>> = (key: K) => Promise<void>;
export type RemoveItems<T = any, K extends StorageKeys<T>[] = StorageKeys<T>[]> = (keys: K) => Promise<void>;

export interface StorageInterface<T = any> {
    getItem: GetItem<T>;
    getItems: GetItems<T>;
    setItem: SetItem<T>;
    setItems: SetItems<T>;
    removeItem: RemoveItem<T>;
    removeItems: RemoveItems<T>;
    clear: () => Promise<void>;
}
