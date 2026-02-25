import { expose } from 'comlink';

import type { MigrationToolParams } from './interface';

export const migrationTool = async ({ user, keyPassword }: MigrationToolParams) => {
    console.log('Welcome from the migration tool', user, keyPassword);
};

expose(migrationTool);
