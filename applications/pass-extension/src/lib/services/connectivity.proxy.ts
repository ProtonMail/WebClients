import { resolveMessageFactory, sendMessage } from 'proton-pass-extension/lib/message/send-message';
import { WorkerMessageType } from 'proton-pass-extension/types/messages';

import type { ConnectivityEvent, ConnectivityService } from '@proton/pass/lib/network/connectivity.service';
import { ConnectivityStatus } from '@proton/pass/lib/network/connectivity.utils';
import type { ClientEndpoint } from '@proton/pass/types';
import { throwError } from '@proton/pass/utils/fp/throw';
import { createListenerStore } from '@proton/pass/utils/listener/factory';
import { createPubSub } from '@proton/pass/utils/pubsub/factory';
import noop from '@proton/utils/noop';

const notImplemented = () => throwError({ name: 'NotImplemented' });

export const createConnectivityProxy = (endpoint: ClientEndpoint): ConnectivityService => {
    let status: ConnectivityStatus = ConnectivityStatus[navigator.onLine ? 'ONLINE' : 'OFFLINE'];

    const pubsub = createPubSub<ConnectivityEvent>();
    const listeners = createListenerStore();
    const message = resolveMessageFactory(endpoint);

    const setStatus = (next: ConnectivityStatus) => {
        if (next !== status) {
            status = next;
            pubsub.publish({ type: 'status', status: next });
        }
    };

    const handleEvent = () => {
        const online = navigator.onLine;
        sendMessage(message({ type: WorkerMessageType.CONNECTIVITY_SYNC, payload: { online } })).catch(noop);
    };

    if (endpoint === 'popup') {
        /** Only the popup forwards navigator transitions to the worker. */
        listeners.addListener(window, 'online', handleEvent);
        listeners.addListener(window, 'offline', handleEvent);
    }

    return {
        get online() {
            return status === ConnectivityStatus.ONLINE;
        },

        get status() {
            return status;
        },

        get retryHandler() {
            return null;
        },

        check: notImplemented,
        init: notImplemented,
        syncNavigatorOnline: notImplemented,

        destroy: () => listeners.removeAll(),
        setStatus,
        subscribe: pubsub.subscribe,
    };
};
