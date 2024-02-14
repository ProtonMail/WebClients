import { createPassExport } from '@proton/pass/lib/export/export';
import { selectExportData } from '@proton/pass/store/selectors/export';
import { WorkerMessageType } from '@proton/pass/types';

import * as config from '../../config';
import WorkerMessageBroker from '../channel';
import { onContextReady } from '../context';
import store from '../store';

export const createExportService = () => {
    WorkerMessageBroker.registerMessage(
        WorkerMessageType.EXPORT_REQUEST,
        onContextReady(async (_, { payload: options }) => {
            const state = store.getState();
            const data = selectExportData({ config, format: options.format })(state);
            const file = await createPassExport(data, options);

            return { file };
        })
    );

    return {};
};

export type ExportService = ReturnType<typeof createExportService>;
