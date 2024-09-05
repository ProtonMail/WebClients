import * as config from 'proton-pass-extension/app/config';
import WorkerMessageBroker from 'proton-pass-extension/app/worker/channel';
import { onContextReady } from 'proton-pass-extension/app/worker/context/inject';

import { createPassExport } from '@proton/pass/lib/export/export';
import { selectExportData } from '@proton/pass/store/selectors/export';
import { WorkerMessageType } from '@proton/pass/types';

export const createExportService = () => {
    WorkerMessageBroker.registerMessage(
        WorkerMessageType.EXPORT_REQUEST,
        onContextReady(async (ctx, { payload: options }) => {
            const state = ctx.service.store.getState();
            const data = selectExportData({ config, format: options.format })(state);
            const file = await createPassExport(data, options);

            return { file };
        })
    );

    return {};
};

export type ExportService = ReturnType<typeof createExportService>;
