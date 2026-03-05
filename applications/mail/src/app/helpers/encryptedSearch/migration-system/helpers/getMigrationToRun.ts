import type { CONTENT_VERSION } from '../../esBuild';
import type { MigrationMethod } from '../interface';

export const getMigrationToRun = (
    contentVersion: CONTENT_VERSION,
    migrationArray: MigrationMethod[]
): MigrationMethod[] => {
    return migrationArray
        .filter((data) => data.targetVersion > contentVersion)
        .sort((a, b) => a.targetVersion - b.targetVersion);
};
