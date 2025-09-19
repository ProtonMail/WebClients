import { configureStore } from '@reduxjs/toolkit';
import { combineReducers } from 'redux';

import type { CreateNotificationOptions } from '@proton/components';
import type { ApiWithListener } from '@proton/shared/lib/api/createApi';

import app from './app';
import auth from './auth';
import settings from './settings';
import update from './update';
import { createErrorMiddleware } from './utils';

export type RootState = ReturnType<typeof rootReducer>;
export type AppDispatch = ReturnType<typeof setupStore>['dispatch'];

export type AppModal = {
    type?: 'danger';
    title?: string;
    message?: string;
    warning?: string;
    cancelable?: boolean;
    submitText?: string;
    cancelText?: string;
};

export type AppThunkExtra = {
    createNotification: (opts: CreateNotificationOptions) => void;
    createModal: (modal: AppModal) => Promise<boolean>;
    api: ApiWithListener;
};

const rootReducer = combineReducers({ app, auth, settings, update });

export const setupStore = (extraArgument: AppThunkExtra) =>
    configureStore({
        reducer: rootReducer,
        middleware: (getDefaultMiddleware) => {
            const base = getDefaultMiddleware({ thunk: { extraArgument } });
            const errors = createErrorMiddleware(extraArgument);
            return base.concat([errors]);
        },
    });
