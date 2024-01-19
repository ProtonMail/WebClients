import { configureStore } from '@reduxjs/toolkit';

import type { ProtonThunkArguments } from './interface';
import { sharedReducers } from './sharedReducers';

export const extraThunkArguments = {} as ProtonThunkArguments;

export const baseConfigureStore = () => {
    return configureStore({
        reducer: sharedReducers,
        middleware: (getDefaultMiddleware) =>
            getDefaultMiddleware({
                thunk: { extraArgument: extraThunkArguments },
            }),
    });
};

export type SharedStore = ReturnType<typeof baseConfigureStore>;
