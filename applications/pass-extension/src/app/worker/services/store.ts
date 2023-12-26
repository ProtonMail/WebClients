import type { MessageHandlerCallback } from '@proton/pass/lib/extension/message';
import { selectUser } from '@proton/pass/store/selectors';
import { WorkerMessageType } from '@proton/pass/types';

import WorkerMessageBroker from '../channel';
import { onContextReady } from '../context';
import store from '../store';

export const createStoreService = () => {
    const handleStoreDispatch: MessageHandlerCallback<WorkerMessageType.STORE_DISPATCH> = onContextReady(
        (_, message) => {
            store.dispatch(message.payload.action);
            return true;
        }
    );

    const handleResolveUser = () => ({ user: selectUser(store.getState()) });

    WorkerMessageBroker.registerMessage(WorkerMessageType.STORE_DISPATCH, handleStoreDispatch);
    WorkerMessageBroker.registerMessage(WorkerMessageType.RESOLVE_USER, handleResolveUser);

    return {};
};

export type StoreService = ReturnType<typeof createStoreService>;
