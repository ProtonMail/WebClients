import { expose, transferHandlers } from 'comlink';
// apply polyfills
import 'core-js/stable';

import { Api as WorkerApi } from './api';
import { workerTransferHandlers } from './transferHandlers';

workerTransferHandlers.forEach(({ name, handler }) => transferHandlers.set(name, handler));

WorkerApi.init();

expose(WorkerApi);
