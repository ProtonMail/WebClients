import { configureStore } from '@reduxjs/toolkit';

import { apiStatusReducer } from '@proton/account/index';
import { ignoredActions, ignoredPaths } from '@proton/redux-shared-store/sharedSerializable';

/**
 * Minimal store
 * @warning:
 * This store is both accessible on public and private apps.
 * Only basic reducers are meant to be added there.
 */
export const setupStore = () => {
    return configureStore({
        reducer: { ...apiStatusReducer },
        devTools: process.env.NODE_ENV !== 'production',
        middleware: (getDefaultMiddleware) =>
            getDefaultMiddleware({
                serializableCheck: {
                    ignoredActions: [...ignoredActions],
                    ignoredPaths: [...ignoredPaths],
                },
            }),
    });
};
