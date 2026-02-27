import * as Comlink from 'comlink';

import { Logger } from '../Logger';
import { SharedWorkerAPI } from './SharedWorkerAPI';

declare const self: { onconnect: (e: MessageEvent) => void };

const api = new SharedWorkerAPI();

Logger.info(`SharedWorker created`);

self.onconnect = (e: MessageEvent) => {
    // For shared workers, the port must be exposed.
    Comlink.expose(api, e.ports[0]);
    Logger.info(`SharedWorker connected`);
};
