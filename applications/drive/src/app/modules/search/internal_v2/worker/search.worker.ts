import * as Comlink from 'comlink';

import { SharedWorkerAPI } from './SharedWorkerAPI';

const api = new SharedWorkerAPI();

// SharedWorker entry point
declare const self: SharedWorkerGlobalScope;

self.onconnect = (event: MessageEvent) => {
    const port = event.ports[0];
    Comlink.expose(api, port);
};
