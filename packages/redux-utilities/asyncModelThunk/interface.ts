import type { SerializedError } from '@reduxjs/toolkit';

export type ReducerValue<Returned> = {
    value: Returned | undefined;
    error: SerializedError | undefined;
    meta: {
        fetchedAt: number;
        // If this state was fetched during the lifetime of this app. It's pruned for the persisted state.
        fetchedEphemeral: boolean | undefined;
    };
};

export enum CacheType {
    None,
    Stale,
    StaleRefetch,
}

export type ThunkOptions<T> = {
    cache?: CacheType;
    thunkArg?: T;
};
