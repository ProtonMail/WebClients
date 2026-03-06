import { proxy, wrap } from 'comlink';

import { SentryMailInitiatives, traceInitiativeError } from '@proton/shared/lib/helpers/sentry';

import { cleanText } from '../esBuild';
import type { MigrationToolAPI, MigrationToolParams } from './interface';

export const migrationToolWorker = async ({ user, keyPassword }: MigrationToolParams) => {
    const worker = new Worker(
        /* webpackChunkName: "es-migration-tools" */
        new URL('./migrationTool.ts', import.meta.url)
    );

    try {
        const workerProxy = wrap<MigrationToolAPI>(worker);
        await workerProxy.migration(
            { user, keyPassword },
            proxy(async (text: string, includeQuote: boolean) => cleanText(text, includeQuote))
        );
    } catch (error) {
        traceInitiativeError(SentryMailInitiatives.MIGRATION_TOOL, error);
    } finally {
        worker.terminate();
    }
};
