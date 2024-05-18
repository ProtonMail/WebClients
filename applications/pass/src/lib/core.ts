import { createPassCoreProxy } from '@proton/pass/lib/core/proxy';
import { createPassCoreWorkerService } from '@proton/pass/lib/core/worker.service';

export const core = createPassCoreProxy(createPassCoreWorkerService());
