import { createPassExport } from '@proton/pass/lib/export/export';
import { selectExportData } from '@proton/pass/store/selectors/export';
import { SessionLockStatus, WorkerMessageType } from '@proton/pass/types';

import * as config from '../../config';
import WorkerMessageBroker from '../channel';
import { onContextReady } from '../context';
import store from '../store';

export const createExportService = () => {
    WorkerMessageBroker.registerMessage(
        WorkerMessageType.EXPORT_REQUEST,
        onContextReady(async (ctx, { payload: options }) => {
            const lock = await ctx.service.auth.checkLock();
            if (lock.status === SessionLockStatus.LOCKED) throw Error('Session locked');

            const state = store.getState();
            const data = selectExportData({ config, encrypted: options.encrypted })(state);
            const file = await createPassExport(data, options);

            return { file };
        })
    );

    return {};
};

export type ExportService = ReturnType<typeof createExportService>;
