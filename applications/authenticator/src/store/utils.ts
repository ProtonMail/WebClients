import { useDispatch, useSelector } from 'react-redux';

import { type Middleware, type PayloadAction, type SerializedError, createAsyncThunk } from '@reduxjs/toolkit';
import type { AppDispatch, AppThunkExtra, RootState } from 'applications/authenticator/src/store';

export const useAppDispatch = useDispatch.withTypes<AppDispatch>();

export const useAppSelector = useSelector.withTypes<RootState>();

export const createAppAsyncThunk = createAsyncThunk.withTypes<{
    state: RootState;
    dispatch: AppDispatch;
    extra: AppThunkExtra;
}>();

export const createErrorMiddleware = ({ createNotification }: AppThunkExtra): Middleware<{}, RootState> => {
    function isPayloadWithError(action: any): action is PayloadAction<unknown, string, unknown, SerializedError> {
        return typeof action === 'object' && action !== null && 'error' in action;
    }

    return () => (next) => (action: unknown) => {
        // Call the next dispatch method in the middleware chain.
        const returnValue = next(action);

        if (isPayloadWithError(action) && action.error.message) {
            const { message: text } = action.error;
            createNotification({ type: 'error', text });
        }

        // This will likely be the action itself, unless
        // a middleware further in chain changed it.
        return returnValue;
    };
};
