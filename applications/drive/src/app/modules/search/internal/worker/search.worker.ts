import * as Comlink from 'comlink';
// Polyfill Uint8Array.fromBase64/toBase64
import 'core-js/proposals/array-buffer-base64';
import 'core-js/stable';

import { registerComlinkErrorTransferHandler } from '../shared/comlinkErrorTransferHandler';
import { parseSharedWorkerName } from '../shared/sharedWorkerName';
import { SharedWorkerAPI } from './SharedWorkerAPI';

// Set-up comlink to propagate errors properly.
// This must be called on both the main thread and the worker thread.
registerComlinkErrorTransferHandler();

// SharedWorker entry point
declare const self: SharedWorkerGlobalScope;

const { appVersion, userId } = parseSharedWorkerName(self.name);
const api = new SharedWorkerAPI(appVersion, userId, () => self.close());

self.onconnect = (event: MessageEvent) => {
    const port = event.ports[0];
    Comlink.expose(api, port);
};
