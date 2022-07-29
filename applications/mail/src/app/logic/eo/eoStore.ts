import { configureStore } from '@reduxjs/toolkit';

import eo from './eoSlice';

export const store = configureStore({
    reducer: {
        eo,
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

// Infer the `RootState` and `AppDispatch` types from the store itself
export type RootState = ReturnType<typeof store.getState>;
