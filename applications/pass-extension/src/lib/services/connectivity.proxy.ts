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
        check: notImplemented,
        init: notImplemented,
        destroy: notImplemented,
        setStatus,
        getStatus: () => status,
        subscribe: pubsub.subscribe,
    };
};
