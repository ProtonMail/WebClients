import { configureStore } from '@reduxjs/toolkit';
import createSagaMiddleware from 'redux-saga';

import reducer from '@proton/pass/store/reducers';
import { requestMiddleware } from '@proton/pass/store/request/middleware';

import { cacheMiddleware } from './cache.middleware';

export const sagaMiddleware = createSagaMiddleware();

export const store = configureStore({
    reducer,
    middleware: (mw) =>
        mw({ serializableCheck: false, thunk: false }).concat(cacheMiddleware, requestMiddleware, sagaMiddleware),
});
