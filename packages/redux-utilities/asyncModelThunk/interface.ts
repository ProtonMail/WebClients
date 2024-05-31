import type { SerializedError } from '@reduxjs/toolkit';

export type ReducerValue<Returned> = {
    value: Returned | undefined;
    error: SerializedError | undefined;
    meta: {
        fetchedAt: number;
    };
};

export type CacheType = 'no-cache' | 'stale';

export type ThunkOptions<T> = {
    cache?: CacheType;
    thunkArg?: T;
};
