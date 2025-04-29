import { createPassCoreProxy } from '@proton/pass/lib/core/core.proxy';
import { PassCoreWorkerService } from '@proton/pass/lib/core/core.worker.service';

export const core = createPassCoreProxy(PassCoreWorkerService);
