import { proxy, wrap } from 'comlink';

import type { ApiWithListener } from '@proton/shared/lib/api/createApi';
import { SentryMailInitiatives, traceInitiativeError } from '@proton/shared/lib/helpers/sentry';

import { cleanText } from '../esBuild';
import type { MigrationToolAPI, MigrationToolParams } from './interface';

export const migrationToolWorker = async ({
    user,
    keyPassword,
    metricsEnabled,
    api,
}: MigrationToolParams & { api: ApiWithListener }) => {
    const worker = new Worker(
        /* webpackChunkName: "es-migration-tools" */
        new URL('./migrationTool.ts', import.meta.url)
    );

    try {
        const workerProxy = wrap<MigrationToolAPI>(worker);
        await workerProxy.migration(
            { user, keyPassword, metricsEnabled },
            proxy(async (text: string, includeQuote: boolean) => cleanText(text, includeQuote)),
            proxy(api)
        );
    } catch (error) {
        traceInitiativeError(SentryMailInitiatives.MIGRATION_TOOL, error);
    } finally {
        worker.terminate();
    }
};
