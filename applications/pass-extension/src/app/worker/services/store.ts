import WorkerMessageBroker from 'proton-pass-extension/app/worker/channel';
import { onContextReady } from 'proton-pass-extension/app/worker/context/inject';
import store, { runSagas } from 'proton-pass-extension/app/worker/store';

import type { MessageHandlerCallback } from '@proton/pass/lib/extension/message/message-broker';
import { selectUser } from '@proton/pass/store/selectors';
import { WorkerMessageType } from '@proton/pass/types';

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

    return store;
};

export type StoreService = ReturnType<typeof createStoreService>;
