import * as Comlink from 'comlink';
// Polyfill Uint8Array.fromBase64/toBase64
import 'core-js/proposals/array-buffer-base64';
import 'core-js/stable';

import { registerComlinkErrorTransferHandler } from '../shared/comlinkErrorTransferHandler';
import { SharedWorkerAPI } from './SharedWorkerAPI';

// Set-up comlink to propagate errors properly.
// This must be called on both the main thread and the worker thread
// so that custom error types survive serialization across the comlink boundary.
registerComlinkErrorTransferHandler();

const api = new SharedWorkerAPI();

// SharedWorker entry point
declare const self: SharedWorkerGlobalScope;

self.onconnect = (event: MessageEvent) => {
    const port = event.ports[0];
    Comlink.expose(api, port);
};
