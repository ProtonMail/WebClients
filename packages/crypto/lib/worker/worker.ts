import { expose, transferHandlers } from 'comlink';

import { Api as WorkerApi } from './api';
import { workerTransferHandlers } from './transferHandlers';

workerTransferHandlers.forEach(({ name, handler }) => transferHandlers.set(name, handler));

WorkerApi.init();

expose(WorkerApi);
