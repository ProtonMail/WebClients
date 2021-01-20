export interface Counter {
    LabelID: string;
    Total: number;
    Unread: number;
}

export interface CacheEntry<T> {
    status: number;
    value: T;
}
