import { configureStore } from '@reduxjs/toolkit';

import { apiStatusReducer } from '@proton/account/apiStatus';
import { eligibleTrialsReducer } from '@proton/account/eligibleTrials';
import { paymentStatusReducer } from '@proton/account/paymentStatus';
import { plansReducer } from '@proton/account/plans';
import { referralInfoReducer } from '@proton/account/referralInfo';
import { ignoredActions, ignoredPaths } from '@proton/redux-shared-store/sharedSerializable';

import { type AccountThunkPublicArguments, extraThunkArguments } from './public-thunk';

export const setupStore = () => {
    return configureStore({
        reducer: {
            ...paymentStatusReducer,
            ...plansReducer,
            ...apiStatusReducer,
            ...referralInfoReducer,
            ...eligibleTrialsReducer,
        },
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
