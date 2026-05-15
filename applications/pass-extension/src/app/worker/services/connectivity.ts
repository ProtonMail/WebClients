import WorkerMessageBroker from 'proton-pass-extension/app/worker/channel';
import { backgroundMessage } from 'proton-pass-extension/lib/message/send-message';
import { WorkerMessageType } from 'proton-pass-extension/types/messages';

import { api } from '@proton/pass/lib/api/api';
import type { ConnectivityService, GetRetryTimeout } from '@proton/pass/lib/network/connectivity.service';
import { createConnectivityService as createCoreConnectivityService } from '@proton/pass/lib/network/connectivity.service';
import { CONNECTIVITY_RETRY_TIMEOUT, type ConnectivityStatus } from '@proton/pass/lib/network/connectivity.utils';
import { FIBONACCI_LIST } from '@proton/shared/lib/constants';

/** Fib backoff for ALL statuses: avoids a flat 5s polling loop that would
 * keep the MV3 service worker alive across the SW's idle-shutdown window. */
const getExtensionRetryTimeout: GetRetryTimeout = (_, retryCount) =>
    CONNECTIVITY_RETRY_TIMEOUT * FIBONACCI_LIST[Math.min(retryCount, FIBONACCI_LIST.length - 1)];

export const createConnectivityService = (): ConnectivityService => {
    const service = createCoreConnectivityService({ api, getRetryTimeout: getExtensionRetryTimeout });

    const broadcast = (status: ConnectivityStatus) => {
        WorkerMessageBroker.ports.broadcast(
            backgroundMessage({
                type: WorkerMessageType.CONNECTIVITY,
                payload: { status },
            })
        );
    };

    service.subscribe((event) => event.type === 'status' && broadcast(event.status));
    void service.init();

    return service;
};
