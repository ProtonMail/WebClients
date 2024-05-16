import { expose, transferHandlers } from 'comlink';
// apply polyfills
import 'core-js/stable';

import { Api as WorkerApi } from './api_v6_canary';
import { workerTransferHandlers } from './transferHandlers';

workerTransferHandlers.forEach(({ name, handler }) => transferHandlers.set(name, handler));

WorkerApi.init()

expose(WorkerApi);
