import type { ConnectivityService } from '@proton/pass/lib/network/connectivity.service';
import { ConnectivityStatus } from '@proton/pass/lib/network/connectivity.utils';
import { throwError } from '@proton/pass/utils/fp/throw';
import { createPubSub } from '@proton/pass/utils/pubsub/factory';

const notImplemented = () => throwError({ name: 'NotImplemented' });

export const createConnectivityProxy = (): ConnectivityService => {
    let status: ConnectivityStatus = ConnectivityStatus[navigator.onLine ? 'ONLINE' : 'OFFLINE'];
    const pubsub = createPubSub<ConnectivityStatus>();

    const setStatus = (next: ConnectivityStatus) => {
        if (next !== status) {
            status = next;
            pubsub.publish(next);
        }
    };

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
        destroy: notImplemented,

        setStatus,
        subscribe: pubsub.subscribe,
    };
};
