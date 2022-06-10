import { expose, transferHandlers } from 'comlink';
import { workerTransferHandlers } from './transferHandlers';
import { Api as WorkerApi } from './api';

workerTransferHandlers.forEach(({ name, handler }) => transferHandlers.set(name, handler));

WorkerApi.init();

expose(WorkerApi);
