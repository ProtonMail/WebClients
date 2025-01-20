import { configureStore } from '@reduxjs/toolkit';

import { paymentStatusReducer, plansReducer } from '@proton/account';
import { ignoredActions, ignoredPaths } from '@proton/redux-shared-store/sharedSerializable';

import { type AccountThunkPublicArguments, extraThunkArguments } from './public-thunk';

export const setupStore = () => {
    return configureStore({
        reducer: { ...paymentStatusReducer, ...plansReducer },
        devTools: process.env.NODE_ENV !== 'production',
        middleware: (getDefaultMiddleware) =>
            getDefaultMiddleware({
                serializableCheck: {
                    ignoredActions: [...ignoredActions],
                    ignoredPaths: [...ignoredPaths],
                },
                thunk: { extraArgument: extraThunkArguments },
            }),
    });
};

export const extendStore = (newThunkArguments: Partial<AccountThunkPublicArguments>) => {
    Object.assign(extraThunkArguments, newThunkArguments);
};
