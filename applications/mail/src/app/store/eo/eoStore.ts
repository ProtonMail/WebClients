import { configureStore } from '@reduxjs/toolkit';

import { apiStatusReducer } from '@proton/account/apiStatus';
import { featuresReducer } from '@proton/features';

import { elementsReducer } from '../elements/elementsSlice';
import eo from './eoSlice';

export const setupStore = () => {
    return configureStore({
        devTools: process.env.NODE_ENV !== 'production',
        reducer: {
            eo,
            ...elementsReducer,
            ...apiStatusReducer,
            features: featuresReducer.reducer,
        },
        middleware: (getDefaultMiddleware) =>
            getDefaultMiddleware({
                serializableCheck: {
                    ignoreState: true,
                    // Ignore these field paths in all actions
                    ignoredActionPaths: ['payload', 'meta'],
                },
            }),
    });
};

export type EOStore = ReturnType<typeof setupStore>;
export type EODispatch = EOStore['dispatch'];
export type EOStoreState = ReturnType<EOStore['getState']>;
