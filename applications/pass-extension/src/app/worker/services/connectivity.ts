import type { Runtime } from 'webextension-polyfill';

import { api } from '@proton/pass/lib/api/api';
import type { ConnectivityService, GetRetryTimeout } from '@proton/pass/lib/network/connectivity.service';
import { createConnectivityService as createCoreConnectivityService } from '@proton/pass/lib/network/connectivity.service';
import { CONNECTIVITY_RETRY_TIMEOUT, type ConnectivityStatus } from '@proton/pass/lib/network/connectivity.utils';
import type { ClientEndpoint } from '@proton/pass/types';
import { FIBONACCI_LIST } from '@proton/shared/lib/constants';

import { backgroundMessage } from '../../../lib/message/send-message';
import { WorkerMessageType } from '../../../types/messages';
import WorkerMessageBroker from '../channel';

/** Fib backoff for ALL statuses: avoids a flat 5s polling loop that would
 * keep the MV3 service worker alive across the SW's idle-shutdown window. */
const getExtensionRetryTimeout: GetRetryTimeout = (_, retryCount) =>
    CONNECTIVITY_RETRY_TIMEOUT * FIBONACCI_LIST[Math.min(retryCount, FIBONACCI_LIST.length - 1)];

/** Navigator state is only trusted from top-level extension UIs: an extension
 * frame embedded in a website (`onboarding.html` is web accessible) follows the
 * website tab's devtools network throttling, not the device's connectivity. */
export const isNavigatorSource = (endpoint: ClientEndpoint, sender: Runtime.MessageSender) =>
    endpoint === 'popup' || (endpoint === 'page' && sender.frameId === 0);

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

    WorkerMessageBroker.registerMessage(
        WorkerMessageType.CONNECTIVITY_SYNC,
        ({ sender: endpoint, payload }, sender) => {
            if (!isNavigatorSource(endpoint, sender)) return true;
            service.syncNavigatorOnline(payload.online);
            return true;
        }
    );

    service.subscribe((event) => event.type === 'status' && broadcast(event.status));
    service.init();

    return service;
};
