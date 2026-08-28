import type { Action } from 'redux';

import { asyncRequestDispatcherFactory } from '@proton/pass/store/request/utils';
import { selectUser } from '@proton/pass/store/selectors/user';
import { deserialize } from '@proton/pass/utils/object/serialize';

import type { MessageHandlerCallback } from '../../../lib/message/message-broker';
import { WorkerMessageType } from '../../../types/messages';
import WorkerMessageBroker from '../channel';
import { onContextReady } from '../context/inject';
import store, { runSagas } from '../store';

export const createStoreService = () => {
    runSagas();

    const handleStoreDispatch: MessageHandlerCallback<WorkerMessageType.STORE_DISPATCH> = onContextReady(
        (_, message) => {
            store.dispatch(deserialize<Action>(message.payload.action));
            return true;
        }
    );

    const handleResolveUser = () => ({ user: selectUser(store.getState()) });

    WorkerMessageBroker.registerMessage(WorkerMessageType.STORE_DISPATCH, handleStoreDispatch);
    WorkerMessageBroker.registerMessage(WorkerMessageType.RESOLVE_USER, handleResolveUser);

    return { ...store, dispatchAsyncRequest: asyncRequestDispatcherFactory(store.dispatch) };
};

export type StoreService = ReturnType<typeof createStoreService>;
