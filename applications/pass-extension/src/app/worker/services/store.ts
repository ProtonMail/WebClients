import WorkerMessageBroker from 'proton-pass-extension/app/worker/channel';
import { onContextReady } from 'proton-pass-extension/app/worker/context/inject';
import store, { runSagas } from 'proton-pass-extension/app/worker/store';
import type { MessageHandlerCallback } from 'proton-pass-extension/lib/message/message-broker';
import { WorkerMessageType } from 'proton-pass-extension/types/messages';

import { asyncRequestDispatcherFactory } from '@proton/pass/store/request/utils';
import { selectUser } from '@proton/pass/store/selectors';

export const createStoreService = () => {
    runSagas();

    const handleStoreDispatch: MessageHandlerCallback<WorkerMessageType.STORE_DISPATCH> = onContextReady(
        (_, message) => {
            store.dispatch(message.payload.action);
            return true;
        }
    );

    const handleResolveUser = () => ({ user: selectUser(store.getState()) });

    WorkerMessageBroker.registerMessage(WorkerMessageType.STORE_DISPATCH, handleStoreDispatch);
    WorkerMessageBroker.registerMessage(WorkerMessageType.RESOLVE_USER, handleResolveUser);

    return { ...store, dispatchAsyncRequest: asyncRequestDispatcherFactory(store.dispatch) };
};

export type StoreService = ReturnType<typeof createStoreService>;
