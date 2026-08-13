import { configureStore } from '@reduxjs/toolkit';
import createSagaMiddleware from 'redux-saga';

import { itemEditMiddleware } from '@proton/pass/store/middleware/item-edit.middleware';
import reducer from '@proton/pass/store/reducers';
import { requestMiddleware } from '@proton/pass/store/request/middleware';

import { broadcastMiddleware } from './broadcast';
import { sshAgentMiddleware } from './ssh-agent.middleware';

export const sagaMiddleware = createSagaMiddleware();

const desktopMiddleware = DESKTOP_BUILD ? [sshAgentMiddleware] : [];

export const store = configureStore({
    reducer,
    middleware: (mw) =>
        mw({
            serializableCheck: false,
            thunk: false,
            immutableCheck: false,
        }).concat(broadcastMiddleware, ...desktopMiddleware, requestMiddleware, itemEditMiddleware, sagaMiddleware),
    devTools: ENV !== 'production',
});
