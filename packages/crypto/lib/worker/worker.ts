import { expose, transferHandlers } from 'comlink';
// apply polyfills
import 'core-js/stable';

import { Api as WorkerApi } from './api';
import { workerTransferHandlers } from './transferHandlers';

workerTransferHandlers.forEach(({ name, handler }) => transferHandlers.set(name, handler));

// WorkerApi.init() will be called in the main thread, to support passing inputs
expose(WorkerApi);
