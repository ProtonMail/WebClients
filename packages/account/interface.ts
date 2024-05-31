export interface ModelState<T> {
    value: T | undefined;
    error: any;
    meta: {
        fetchedAt: number;
    };
}
