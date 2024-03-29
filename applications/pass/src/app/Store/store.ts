import { configureStore } from '@reduxjs/toolkit';
import createSagaMiddleware from 'redux-saga';

import { requestMiddleware } from '@proton/pass/store/middlewares/request-middleware';
import reducer from '@proton/pass/store/reducers';

import { cacheMiddleware } from './cache.middleware';

export const sagaMiddleware = createSagaMiddleware();

export const store = configureStore({
    reducer,
    middleware: (mw) =>
        mw({ serializableCheck: false, thunk: false }).concat(cacheMiddleware, requestMiddleware, sagaMiddleware),
});
