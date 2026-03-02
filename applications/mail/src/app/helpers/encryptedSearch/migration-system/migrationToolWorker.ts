import { wrap } from 'comlink';

import { SentryMailInitiatives, traceInitiativeError } from '@proton/shared/lib/helpers/sentry';

import type { MigrationToolAPI, MigrationToolParams } from './interface';

export const migrationToolWorker = async ({ user, keyPassword }: MigrationToolParams) => {
    const worker = new Worker(
        /* webpackChunkName: "es-migration-tools" */
        new URL('./migrationTool.ts', import.meta.url)
    );

    try {
        const workerProxy = wrap<MigrationToolAPI>(worker);
        await workerProxy.migration({ user, keyPassword });
    } catch (error) {
        traceInitiativeError(SentryMailInitiatives.MIGRATION_TOOL, error);
    } finally {
        worker.terminate();
    }
};
