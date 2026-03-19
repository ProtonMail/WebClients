import { expose } from 'comlink';

import { getIndexKey } from '@proton/encrypted-search/esHelpers';
import { openESDB } from '@proton/encrypted-search/esIDB';
import type { ApiWithListener } from '@proton/shared/lib/api/createApi';
import { TelemetryESMigrationToolEvents, TelemetryMeasurementGroups } from '@proton/shared/lib/api/telemetry';
import { sendTelemetryReport, setMetricsEnabled } from '@proton/shared/lib/helpers/metrics';
import { getDecryptedUserKeysHelper } from '@proton/shared/lib/keys/getDecryptedUserKeys';

import { migrateContent } from './helpers/migrationHelpers';
import { getTelemetryDimensions } from './helpers/telemetryDimensions';
import type { CleanTextFn, MigrationToolAPI, MigrationToolParams } from './interface';
import { setupCryptoProxy } from './setupCryptoProxy';

export const migration = async (
    { user, keyPassword, metricsEnabled }: MigrationToolParams,
    cleanText: CleanTextFn,
    api: ApiWithListener
) => {
    const esDB = await openESDB(user.ID);
    if (!esDB) {
        return;
    }

    setMetricsEnabled(metricsEnabled);
    await setupCryptoProxy();
    const userKeys = await getDecryptedUserKeysHelper(user, keyPassword);
    const indexKey = await getIndexKey(userKeys, user.ID);
    if (!indexKey) {
        return;
    }

    const start = performance.now();
    await migrateContent({ esDB, indexKey, cleanText });
    const end = performance.now();

    const durationSeconds = (end - start) / 1000;
    const contentCount = await esDB.countFromIndex('content', 'byVersion');

    await sendTelemetryReport({
        api,
        measurementGroup: TelemetryMeasurementGroups.esMigrationTool,
        event: TelemetryESMigrationToolEvents.migration_finished,
        dimensions: getTelemetryDimensions(durationSeconds, contentCount),
        delay: false,
    });

    // Keep the worker alive for 30 seconds to allow the telemetry report to be sent
    await new Promise((r) => setTimeout(r, 30_000));
};

expose({ migration } satisfies MigrationToolAPI);
