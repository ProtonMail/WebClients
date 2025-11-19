import { configureStore } from '@reduxjs/toolkit';

import { apiStatusReducer } from '@proton/account/apiStatus';
import { featuresReducer } from '@proton/features/reducer';

export const setupGuestBookingStore = () => {
    return configureStore({
        devTools: process.env.NODE_ENV !== 'production',
        reducer: {
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

export type BookingsStore = ReturnType<typeof setupGuestBookingStore>;
export type BookingsDispatch = BookingsStore['dispatch'];
export type BookingsStoreState = ReturnType<BookingsStore['getState']>;
