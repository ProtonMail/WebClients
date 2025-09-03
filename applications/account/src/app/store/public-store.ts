import { configureStore } from '@reduxjs/toolkit';

import { apiStatusReducer, paymentStatusReducer, plansReducer, referralInfoReducer } from '@proton/account';
import { ignoredActions, ignoredPaths } from '@proton/redux-shared-store/sharedSerializable';

import { type AccountThunkPublicArguments, extraThunkArguments } from './public-thunk';

export const setupStore = () => {
    return configureStore({
        reducer: { ...paymentStatusReducer, ...plansReducer, ...apiStatusReducer, ...referralInfoReducer },
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
