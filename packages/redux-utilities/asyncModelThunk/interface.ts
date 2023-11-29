import { SerializedError } from '@reduxjs/toolkit';

export type ReducerValue<Returned> = {
    value: Returned | undefined;
    error: SerializedError | undefined;
};

export type ThunkOptions<T> = {
    forceFetch?: boolean;
    thunkArg?: T;
};
