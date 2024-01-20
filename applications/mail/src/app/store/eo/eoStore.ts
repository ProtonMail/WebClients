import { configureStore } from '@reduxjs/toolkit';

import { featuresReducer } from '@proton/features';

import { elementsReducer } from '../elements/elementsSlice';
import eo from './eoSlice';

export const setupStore = () => {
    return configureStore({
        devTools: process.env.NODE_ENV !== 'production',
        reducer: {
            eo,
            ...elementsReducer,
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
