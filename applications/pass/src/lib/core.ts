import { createPassCoreProxy } from '@proton/pass/lib/core/core.proxy';
import { createPassCoreWorkerService } from '@proton/pass/lib/core/core.worker.service';

export const core = createPassCoreProxy(createPassCoreWorkerService());
