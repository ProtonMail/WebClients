import { combineReducers, configureStore } from '@reduxjs/toolkit';

import { type ThunkArguments, featuresReducer } from '../reducer';

const rootReducer = combineReducers({
    features: featuresReducer.reducer,
});
type FeaturesState = ReturnType<typeof rootReducer>;
export const setupStore = ({
    preloadedState,
    extraThunkArguments,
}: {
    preloadedState?: FeaturesState;
    extraThunkArguments: ThunkArguments;
}) => {
    return configureStore({
        preloadedState,
        reducer: rootReducer,
        middleware: (getDefaultMiddleware) =>
            getDefaultMiddleware({
                thunk: { extraArgument: extraThunkArguments },
            }),
    });
};
