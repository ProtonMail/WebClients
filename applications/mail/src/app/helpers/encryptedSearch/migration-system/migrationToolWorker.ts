import { wrap } from 'comlink';

import type { MigrationToolParams } from './interface';

export const migrationToolWorker = async ({ user, keyPassword }: MigrationToolParams) => {
    try {
        const worker = new Worker(
            /* webpackChunkName: "es-migration-tools" */
            new URL('./migrationTool.ts', import.meta.url)
        );

        const workerProxy = wrap<(data: MigrationToolParams) => Promise<void>>(worker);
        await workerProxy({ user, keyPassword });
    } catch (error) {
        console.error('Encrypted search migration failed:', error);
    }
};
