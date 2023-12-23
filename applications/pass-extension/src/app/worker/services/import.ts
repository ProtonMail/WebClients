import { prepareImport } from '@proton/pass/lib/import/reader';
import { WorkerMessageType } from '@proton/pass/types';

import WorkerMessageBroker from '../channel';

export const createImportService = () => {
    WorkerMessageBroker.registerMessage(WorkerMessageType.IMPORT_PREPARE, async ({ payload }) => ({
        payload: await prepareImport(payload),
    }));

    return {};
};

export type ImportService = ReturnType<typeof createImportService>;
