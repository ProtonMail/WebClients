import WorkerMessageBroker from 'proton-pass-extension/app/worker/channel';
import { backgroundMessage } from 'proton-pass-extension/lib/message/send-message';
import { WorkerMessageType } from 'proton-pass-extension/types/messages';

import { api } from '@proton/pass/lib/api/api';
import type { ConnectivityService } from '@proton/pass/lib/network/connectivity.service';
import { createConnectivityService as createCoreConnectivityService } from '@proton/pass/lib/network/connectivity.service';
import type { ConnectivityStatus } from '@proton/pass/lib/network/connectivity.utils';

export const createConnectivityService = (): ConnectivityService => {
    const service = createCoreConnectivityService({ api });

    const broadcast = (status: ConnectivityStatus) => {
        WorkerMessageBroker.ports.broadcast(
            backgroundMessage({
                type: WorkerMessageType.CONNECTIVITY,
                payload: { status },
            })
        );
    };

    service.subscribe(broadcast);
    service.init();

    return service;
};
